const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Lead = require('../models/Lead');
const { authenticationToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticationToken); 


const leadValidation = [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('phone').trim().isLength({ min: 1 }).withMessage('Phone is required'),
    body('company').trim().isLength({ min: 1 }).withMessage('Company is required'),
    body('city').trim().isLength({ min: 1 }).withMessage('City is required'),
    body('state').trim().isLength({ min: 1 }).withMessage('State is required'),
    body('source').isIn(['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other']).withMessage('Invalid source'),
    body('status').isIn(['new', 'contacted', 'qualified', 'lost', 'won']).withMessage('Invalid status'),
    body('score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
    body('leadValue').isFloat({ min: 0 }).withMessage('Lead value must be a positive number'),
    body('isQualified').isBoolean().withMessage('isQualified must be a boolean'),
    body('lastActivityAt').optional({ nullable: true }).isISO8601().withMessage('Invalid date format')
];

const updateLeadValidation = [
    body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('phone').optional().trim().isLength({ min: 1 }).withMessage('Phone is required'),
    body('company').optional().trim().isLength({ min: 1 }).withMessage('Company is required'),
    body('city').optional().trim().isLength({ min: 1 }).withMessage('City is required'),
    body('state').optional().trim().isLength({ min: 1 }).withMessage('State is required'),
    body('source').optional().isIn(['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other']).withMessage('Invalid source'),
    body('status').optional().isIn(['new', 'contacted', 'qualified', 'lost', 'won']).withMessage('Invalid status'),
    body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
    body('leadValue').optional().isFloat({ min: 0 }).withMessage('Lead value must be a positive number'),
    body('isQualified').optional().isBoolean().withMessage('isQualified must be a boolean'),
    body('lastActivityAt').optional({ nullable: true }).isISO8601().withMessage('Invalid date format')
];

//build mongodb filters from query parameters
const buildFilters = (query, userId) => {
    const filters = { userId };

    ['email', 'company', 'city'].forEach(field => {
        if (query[`${field}_equals`]) {
            filters[field] = query[`${field}_equals`];
        } else if (query[`${field}_contains`]) {
            filters[field] = new RegExp(query[`${field}_contains`], 'i');
        }
    })

    ['score', 'leadValue'].forEach(field => {
        if (query[`${field}_equals`]) {
            filters[field] = parseFloat(query[`${field}_equals`]);
        } else if (query[`${field}_gt`] || query[`${field}_lt`] || query[`${field}_between`]) {
            filters[field] = {};

            if (query[`${field}_gt`]) {
                filters[field].$gt = parseFloat(query[`${field}_gt`]);
            }
            if (query[`${field}_lt`]) {
                filters[field].$lt = parseFloat(query[`${field}_lt`]);
            }
            if (query[`${field}_between`]) {
                const [min, max] = query[`${field}_between`].split(',').map(v => parseFloat(v));
                filters[field].$gte = min;
                filters[field].$lte = max;
            }
        }
    });

    ['createdAt', 'lastActivityAt'].forEach(field => {
        if (query[`${field}_on`]) {
            const date = new Date(query[`${field}_on`]);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            filters[field] = { $gte: date, $lt: nextDay };
        } else if (query[`${field}_before`] || query[`${field}_after`] || query[`${field}_between`]) {
            filters[field] = {};

            if (query[`${field}_before`]) {
                filters[field].$lt = new Date(query[`${field}_before`]);
            }
            if (query[`${field}_after`]) {
                filters[field].$gt = new Date(query[`${field}_after`]);
            }
            if (query[`${field}_between`]) {
                const [start, end] = query[`${field}_between`].split(',');
                filters[field].$gte = new Date(start);
                filters[field].$lte = new Date(end);
            }
        }
    });

    if (query.is_qualified_equals !== undefined) {
        filters.isQualified = query.is_qualified_equals === 'true';
    }

    return filters;
};

//GET - leads

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const filters = buildFilters(req.query, req.userId);

        const [leads, total] = await Promise.all([
            Lead.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Lead.countDocuments(filters)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            data: leads,
            page,
            limit,
            total,
            totalPages
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Post /leads - Creates lead
router.post('/', leadValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation Failed',
                errors: errors.array()
            });
        }

        const existingLead = await Lead.findOne({
            userId: req.userId,
            email: req.body.email
        });

        if (existingLead) {
            return res.status(400).json({
                message: 'Lead with this email already exists'
            });
        }

        const leadData = { ...req.body, userId: req.userId };

        //Handle lastActivityAt
        if (leadData.lastActivityAt === null || leadData.lastActivityAt === '') {
            delete leadData.lastActivityAt;
        }

        const lead = new Lead(leadData);
        await lead.save();

        res.status(201).json({
            message: 'Lead created successfully.',
            lead: lead.toJSON()
        });

    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /leads/:id - get single lead
router.get('/:id', async (req, res) => {
    try {
        const lead = await Lead.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json({ lead: lead.toJSON() });
    } catch (error) {
        console.error('Get single lead error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//PUT /leads/:id - Update lead

router.put('/:id', updateLeadValidation, async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array()
            });
        }
        const existingLead = await Lead.findOne({
            userId: req.userId,
            email: req.body.email,
            _id: { $ne: req.params.id }
        });

        if (existingLead) {
            return res.status(400).json({
                message: 'Another lead with email already exists'
            });
        }

        const updateData = { ...req.body };

        if (updateData.lastActivityAt === null || updateData.lastActivityAt === '') {
            updateData.lastActivityAt = null;
        }

        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        res.status(200).json({
            message: 'Lead updated successfully',
            lead: lead.toJSON()
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//DELETE = lead/:id - Delete lead

router.delete('/:id', async (req, res) => {
    try {
        const lead = await Lead.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json({
            message: 'Lead deleted Successfully'
        })
    } catch (error) {
        console.error('Delete lead error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;



