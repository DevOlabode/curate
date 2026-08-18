const Joi = require('joi');

module.exports.bookmarkSchema = Joi.object({
    title : Joi.string().trim().required(),
    url : Joi.string().trim().required(),
    category : Joi.string().allow('').optional(),
    tags : Joi.alternatives().try(
        Joi.string().allow(''),
        Joi.array().items(Joi.string().allow(''))
    ).optional(),
    notes : Joi.string().allow('').optional(),
}).required();

module.exports.collectionSchema = Joi.object({
    name : Joi.string().trim().required(),
    description : Joi.string().allow('').optional()
}).required();
