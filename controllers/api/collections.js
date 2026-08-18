const Collection = require('../../models/collection');
const Bookmark = require('../../models/bookmark');
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
  const collections = await Collection.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ collections });
};

module.exports.create = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    throw new ExpressError('Please add a collection name.', 400);
  }

  const collection = new Collection({
    name: name.trim(),
    description: description?.trim() || '',
    owner: req.user._id,
    user: req.user._id,
  });
  await collection.save();
  res.status(201).json({ collection });
};

module.exports.getOne = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id }).populate({
    path: 'bookmarks',
    options: { sort: { createdAt: -1 } },
  });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  res.json({ collection });
};

module.exports.update = async (req, res) => {
  const { name, description } = req.body;
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    {
      name: name?.trim(),
      description: description?.trim() || '',
    },
    { new: true, runValidators: true }
  );
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  res.json({ collection });
};

module.exports.remove = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  await Bookmark.deleteMany({ collection: collection._id });
  await Collection.findByIdAndDelete(collection._id);
  res.json({ ok: true });
};

module.exports.createBookmark = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }

  const data = normalizeBookmarkBody(req.body);
  const bookmark = new Bookmark({
    ...data,
    user: req.user._id,
    collection: collection._id,
  });
  collection.bookmarks.push(bookmark._id);
  await collection.save();
  await bookmark.save();
  res.status(201).json({ bookmark });
};

module.exports.getBookmark = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  const bookmark = await Bookmark.findOne({
    _id: req.params.bookmarkId,
    collection: collection._id,
  });
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  res.json({ bookmark, collectionId: collection._id });
};

module.exports.updateBookmark = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  const data = normalizeBookmarkBody(req.body);
  const bookmark = await Bookmark.findOneAndUpdate(
    { _id: req.params.bookmarkId, collection: collection._id },
    data,
    { new: true, runValidators: true }
  );
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  res.json({ bookmark });
};

module.exports.removeBookmark = async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) {
    throw new ExpressError("We couldn't find that collection.", 404);
  }
  const bookmark = await Bookmark.findOneAndDelete({
    _id: req.params.bookmarkId,
    collection: collection._id,
  });
  if (!bookmark) {
    throw new ExpressError("We couldn't find that bookmark.", 404);
  }
  collection.bookmarks = collection.bookmarks.filter(
    (id) => id.toString() !== bookmark._id.toString()
  );
  await collection.save();
  res.json({ ok: true });
};
