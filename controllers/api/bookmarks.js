const Bookmark = require('../../models/bookmark');
const ExpressError = require('../../utils/expressError');
const { parseTags } = require('../../utils/parseTags');

function normalizeBookmarkBody(body) {
  return {
    title: body.title,
    url: body.url,
    category: typeof body.category === 'string' ? body.category.trim() : '',
    tags: parseTags(body.tags),
    notes: body.notes || '',
  };
}

module.exports.list = async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ bookmarks });
};

module.exports.create = async (req, res) => {
  const data = normalizeBookmarkBody(req.body);
  const bookmark = new Bookmark({ ...data, user: req.user._id });
  await bookmark.save();
  res.status(201).json({ bookmark });
};

module.exports.getOne = async (req, res) => {
  const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user._id });
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  res.json({ bookmark });
};

module.exports.update = async (req, res) => {
  const data = normalizeBookmarkBody(req.body);
  const bookmark = await Bookmark.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    data,
    { new: true, runValidators: true }
  );
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  res.json({ bookmark });
};

module.exports.remove = async (req, res) => {
  const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  res.json({ ok: true, bookmark });
};
