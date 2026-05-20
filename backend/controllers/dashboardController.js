const Task = require('../models/Task');
const Project = require('../models/Project');

exports.summary = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const projectFilter = isAdmin
      ? {}
      : { $or: [{ createdBy: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(projectFilter).select('_id name updatedAt').sort('-updatedAt');
    const projectIds = projects.map((p) => p._id);

    const taskFilter = isAdmin
      ? {}
      : { project: { $in: projectIds }, assignedTo: req.user._id };

    const tasks = await Task.find(taskFilter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    const allProjectTasks = projectIds.length
      ? await Task.find({ project: { $in: projectIds } }).select('project status')
      : [];

    const projectProgress = projects.map((p) => {
      const pt = allProjectTasks.filter((t) => t.project.equals(p._id));
      const done = pt.filter((t) => t.status === 'completed').length;
      return {
        _id: p._id,
        name: p.name,
        progress: pt.length ? Math.round((done / pt.length) * 100) : 0,
        totalTasks: pt.length,
        completedTasks: done,
      };
    });

    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status !== 'completed').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;

    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    res.json({
      stats: { total, completed, pending, overdue, completionRate },
      recentProjects: projects.slice(0, 5),
      recentTasks: tasks.slice(0, 6),
      projectProgress: projectProgress.slice(0, 6),
    });
  } catch (e) { next(e); }
};
