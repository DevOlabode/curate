const Joi = require('joi');
const { normalizeUrl, isValidHttpUrl } = require('./utils/normalizeUrl');

module.exports.bookmarkSchema = Joi.object({
    title : Joi.string().trim().required(),
    url : Joi.string().trim().required().custom((value, helpers) => {
        const normalized = normalizeUrl(value);
        if (!isValidHttpUrl(normalized)) {
            return helpers.error('string.uri');
        }
        return normalized;
    }),
    category : Joi.string().allow('').optional(),
    tags : Joi.alternatives().try(
        Joi.string().allow(''),
        Joi.array().items(Joi.string().allow(''))
    ).optional(),
    notes : Joi.string().allow('').optional(),
    collectionId : Joi.string().hex().length(24).allow('').optional(),
}).required();

module.exports.collectionSchema = Joi.object({
    name : Joi.string().trim().required(),
    description : Joi.string().allow('').optional()
}).required();
