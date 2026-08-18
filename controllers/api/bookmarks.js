const mongoose = require('mongoose');
const Bookmark = require('../../models/bookmark');
const Collection = require('../../models/collection');
const ExpressError = require('../../utils/expressError');
const { parseTags } = require('../../utils/parseTags');
const { normalizeUrl } = require('../../utils/normalizeUrl');

function normalizeBookmarkBody(body) {
  return {
    title: body.title,
    url: normalizeUrl(body.url),
    category: typeof body.category === 'string' ? body.category.trim() : '',
    tags: parseTags(body.tags),
    notes: body.notes || '',
  };
}

module.exports.list = async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate('collection', 'name')
    .sort({ createdAt: -1 });
  res.json({ bookmarks });
};

module.exports.create = async (req, res) => {
  const data = normalizeBookmarkBody(req.body);
  const bookmark = new Bookmark({ ...data, user: req.user._id });
  const collectionId = req.body.collectionId;
  let collection = null;

  if (collectionId) {
    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      throw new ExpressError("We couldn't find that collection.", 404);
    }
    collection = await Collection.findOne({ _id: collectionId, owner: req.user._id });
    if (!collection) {
      throw new ExpressError("We couldn't find that collection.", 404);
    }
    bookmark.collection = collection._id;
  }

  await bookmark.save();

  if (collection) {
    collection.bookmarks.push(bookmark._id);
    await collection.save();
  }

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
  if (bookmark.collection) {
    await Collection.updateOne(
      { _id: bookmark.collection },
      { $pull: { bookmarks: bookmark._id } }
    );
  }
  res.json({ ok: true, bookmark });
};
