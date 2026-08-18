const Bookmark = require('../models/bookmark')
const { parseTags } = require('../utils/parseTags');

function bookmarkFromBody(body, userId, collectionId) {
    return {
        title: body.title,
        url: body.url,
        category: typeof body.category === 'string' ? body.category.trim() : '',
        tags: parseTags(body.tags),
        notes: body.notes || '',
        user: userId,
        ...(collectionId ? { collection: collectionId } : {}),
    };
}

module.exports.index = async(req, res)=>{
    const bookmarks = await Bookmark.find({ user : req.user._id });
    res.render('bookmark/index', { bookmarks })
};

module.exports.newForm = (req, res)=>{
    res.render('bookmark/new')
};

module.exports.newBookmark = async (req,res) => {
    const bookmark = new Bookmark(bookmarkFromBody(req.body, req.user._id));
    await bookmark.save();
    res.redirect(`/bookmark/${bookmark._id}`)
};

module.exports.showPage = async(req, res)=>{
    const { id } = req.params;
    const bookmark = await Bookmark.findOne({ _id: id, user: req.user._id });
    if(!bookmark){
        req.flash('error', "We couldn't find that bookmark.");
        return res.redirect(`/bookmark`)
    }
    res.render('bookmark/show', { bookmark });
};

module.exports.editForm = async(req, res)=>{
    const { id } = req.params;
    const bookmark = await Bookmark.findOne({ _id: id, user: req.user._id });
    if(!bookmark){
        req.flash('error', "We couldn't find that bookmark.");
        return res.redirect(`/bookmark`)
    }
    res.render('bookmark/edit', { bookmark })
};

module.exports.editBookmark = async(req, res)=>{
    const { id } = req.params;
    const bookmark = await Bookmark.findOneAndUpdate(
        { _id: id, user: req.user._id },
        bookmarkFromBody(req.body, req.user._id),
        { new: true, runValidators: true }
    );
    if(!bookmark){
        req.flash('error', "We couldn't find that bookmark.");
        return res.redirect(`/bookmark`)
    }

    req.flash('success', 'Bookmark updated.');
    res.redirect(`/bookmark/${bookmark._id}`);
};

module.exports.deleteBookmark = async(req, res)=>{
    const { id } = req.params;
    const delBookmark = await Bookmark.findOneAndDelete({ _id: id, user: req.user._id });
    if(!delBookmark){
        req.flash('error', "We couldn't find that bookmark.");
        return res.redirect('/bookmark');
    }
    req.flash('success', `Deleted “${delBookmark.title}”.`);
    res.redirect('/bookmark');
};
