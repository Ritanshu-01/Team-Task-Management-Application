const Project = require('../models/Project');
const Task = require('../models/Task');
const StatusUpdate = require('../models/StatusUpdate');

const visibleFilter = (user) =>
  user.role === 'admin' ? {} : { $or: [{ createdBy: user._id }, { members: user._id }] };

exports.list = async (req, res, next) => {
  try {
    const projects = await Project.find(visibleFilter(req.user))
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const ids = projects.map((p) => p._id);
    const tasks = ids.length ? await Task.find({ project: { $in: ids } }).select('project status') : [];

    const withProgress = projects.map((p) => {
      const pt = tasks.filter((t) => t.project.equals(p._id));
      const done = pt.filter((t) => t.status === 'completed').length;
      return {
        ...p.toObject(),
        progress: pt.length ? Math.round((done / pt.length) * 100) : 0,
        taskCount: pt.length,
      };
    });

    res.json(withProgress);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role !== 'admin') {
      const allowed =
        project.createdBy._id.equals(req.user._id) ||
        project.members.some((m) => m._id.equals(req.user._id));
      if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    }

    const allTasks = await Task.find({ project: project._id }).select('status');
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === 'completed').length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    const taskQuery = { project: project._id };
    if (req.user.role !== 'admin') taskQuery.assignedTo = req.user._id;

    const tasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    const updates = await StatusUpdate.find({ project: project._id })
      .populate('updatedBy', 'name')
      .populate('task', 'title')
      .sort('-createdAt')
      .limit(10);

    res.json({ project, tasks, progress, updates });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, members = [] } = req.body;
    const project = await Project.create({
      name, description, members, createdBy: req.user._id,
    });
    res.status(201).json(project);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }), ...(members && { members }) },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ project: project._id });
    await StatusUpdate.deleteMany({ project: project._id });
    res.json({ message: 'Project deleted' });
  } catch (e) { next(e); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id, { $addToSet: { members: userId } }, { new: true }
    ).populate('members', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (e) { next(e); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id, { $pull: { members: req.params.userId } }, { new: true }
    ).populate('members', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (e) { next(e); }
};
