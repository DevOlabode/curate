const Collection = require('../models/collection');
const Bookmark = require('../models/bookmark');

module.exports.index = async (req, res) => {
    const collections = await Collection.find({ owner: req.user._id })
        .populate('bookmarks')    
    res.render('collections/index', { collections });
};

module.exports.newForm = (req, res) => {
    res.render('collections/new');
};

module.exports.newCollection = async (req, res) => {
    const { name, description } = req.body;
    
    const collection = new Collection({
        name: name.trim(),
        description: description?.trim() || '',
        owner: req.user._id,
        user: req.user._id
    });
    
    await collection.save();
    req.flash('success', `Collection "${collection.name}" created successfully!`);
    res.redirect(`/collections/${collection._id}`);
};

module.exports.showPage = async (req, res) => {
    const { id } = req.params;
    
    const collection = await Collection.findOne({ 
        _id: id, 
        owner: req.user._id 
    }).populate({
        path: 'bookmarks',
        options: { sort: { createdAt: -1 } }
    });
    
    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    
    res.render('collections/show', { collection });
};

module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    
    const collection = await Collection.findOne({ 
        _id: id, 
        owner: req.user._id 
    });
    
    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    
    res.render('collections/edit', { collection });
};

module.exports.editCollection = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const collection = await Collection.findOneAndUpdate(
        { _id: id, owner: req.user._id },
        { 
            name: name.trim(),
            description: description?.trim() || ''
        },
        { new: true, runValidators: true }
    );
    
    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }
    
    req.flash('success', `Collection "${collection.name}" updated successfully!`);
    res.redirect(`/collections/${collection._id}`);
};

module.exports.deleteCollection = async (req, res) => {
    const { id } = req.params;

    // First find the collection so we still have access to its info
    const collection = await Collection.findOne({
        _id: id,
        owner: req.user._id
    });

    if (!collection) {
        req.flash('warning', "We couldn't find that collection.");
        return res.redirect('/collections');
    }

    await Bookmark.deleteMany({ collection: collection._id });

    await Collection.findByIdAndDelete(collection._id);

    req.flash('info', `Collection "${collection.name}" and all its bookmarks deleted successfully`);
    res.redirect('/collections');
};