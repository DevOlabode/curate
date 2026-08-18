const Collection = require('../models/collection');
const Bookmark = require('../models/bookmark');
const { parseTags } = require('../utils/parseTags');

function bookmarkFromBody(body, userId, collectionId) {
    return {
        title: body.title,
        url: body.url,
        category: typeof body.category === 'string' ? body.category.trim() : '',
        tags: parseTags(body.tags),
        notes: body.notes || '',
        user: userId,
        collection: collectionId,
    };
}

module.exports.newBookmarkForm = async (req, res) => {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });

    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }

    res.render('collectionBookmarks/new', { collection });
};

module.exports.newBookmark = async (req, res) => {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });
    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }

    const bookmark = new Bookmark(bookmarkFromBody(req.body, req.user._id, collection._id));
    collection.bookmarks.push(bookmark._id);
    await bookmark.save();
    await collection.save();
    req.flash('success', `Added to “${collection.name}”.`);
    res.redirect(`/collections/${collection._id}`);
};

module.exports.showPage = async(req, res)=>{
    const { id, bookmarksId } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });
    if(!collection){
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    const bookmark = await Bookmark.findOne({ _id: bookmarksId, collection: collection._id });
    if(!bookmark){
        req.flash('warning', "We couldn't find that bookmark.");
        return res.redirect(`/collections/${collection._id}`);
    }
    res.render('collectionBookmarks/show', { collection, bookmark });
};

module.exports.editForm = async(req, res)=>{
    const { id, bookmarksId } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });
    if(!collection){
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    const bookmark = await Bookmark.findOne({ _id: bookmarksId, collection: collection._id });
    if(!bookmark){
        req.flash('warning', "We couldn't find that bookmark.");
        return res.redirect(`/collections/${collection._id}`);
    }
    res.render('collectionBookmarks/edit', { collection, bookmark });
};

module.exports.editBookmark = async(req, res)=>{
    const { id, bookmarksId } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });
    if(!collection){
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    const bookmark = await Bookmark.findOneAndUpdate(
        { _id: bookmarksId, collection: collection._id },
        bookmarkFromBody(req.body, req.user._id, collection._id),
        { new: true, runValidators: true }
    );
    if(!bookmark){
        req.flash('warning', "We couldn't find that bookmark.");
        return res.redirect(`/collections/${collection._id}`);
    }
    req.flash('success', `Updated bookmark in “${collection.name}”.`);
    res.redirect(`/collections/${collection._id}/bookmarks/${bookmark._id}`);
};

module.exports.deleteBookmark = async(req,res)=>{
    const { id, bookmarksId } = req.params;
    const collection = await Collection.findOne({ _id: id, owner: req.user._id });
    if(!collection){
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    const bookmark = await Bookmark.findOneAndDelete({ _id: bookmarksId, collection: collection._id });
    if(!bookmark){
        req.flash('warning', "We couldn't find that bookmark.");
        return res.redirect(`/collections/${collection._id}`);
    }
    collection.bookmarks = collection.bookmarks.filter(
        (bookmarkId) => bookmarkId.toString() !== bookmark._id.toString()
    );
    await collection.save();
    req.flash('success', `Deleted “${bookmark.title}”.`);
    res.redirect(`/collections/${collection._id}`);
}
