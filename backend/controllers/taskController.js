const Task = require('../models/Task');
const Project = require('../models/Project');
const StatusUpdate = require('../models/StatusUpdate');

const logStatusChange = async (task, previousStatus, newStatus, userId) => {
  if (previousStatus === newStatus) return;
  await StatusUpdate.create({
    task: task._id,
    project: task.project,
    updatedBy: userId,
    previousStatus,
    newStatus,
  });
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.params.projectId || req.query.project) {
      filter.project = req.params.projectId || req.query.project;
    }
    if (req.user.role !== 'admin') {
      const projects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const ids = projects.map((p) => p._id);
      filter.$and = [
        { project: { $in: ids } },
        { $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }] },
      ];
    }
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(tasks);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name members')
      .populate('createdBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin') {
      const isCreator = task.createdBy._id.equals(req.user._id);
      const isAssignee = task.assignedTo && task.assignedTo._id.equals(req.user._id);
      const isProjectMember = task.project.members.some((m) => m.equals(req.user._id));
      if (!isCreator && !isAssignee && !isProjectMember) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    res.json(task);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate, assignedTo, project } = req.body;
    const exists = await Project.findById(project);
    if (!exists) return res.status(404).json({ message: 'Project not found' });

    if (assignedTo) {
      const isMember = exists.members.some((m) => m.equals(assignedTo));
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title, description, priority, status, dueDate, assignedTo, project, createdBy: req.user._id,
    });
    res.status(201).json(task);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignedTo && task.assignedTo.equals(req.user._id);

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const prevStatus = task.status;

    if (!isAdmin) {
      const allowed = ['todo', 'in_progress', 'completed'];
      if (req.body.status && !allowed.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      if (req.body.status) task.status = req.body.status;
    } else {
      const { title, description, priority, status, dueDate, assignedTo } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) {
        if (assignedTo) {
          const proj = await Project.findById(task.project);
          const isMember = proj?.members.some((m) => m.equals(assignedTo));
          if (!isMember) {
            return res.status(400).json({ message: 'Assignee must be a project member' });
          }
        }
        task.assignedTo = assignedTo || null;
      }
    }

    await task.save();
    await logStatusChange(task, prevStatus, task.status, req.user._id);
    res.json(task);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await StatusUpdate.deleteMany({ task: task._id });
    res.json({ message: 'Task deleted' });
  } catch (e) { next(e); }
};
