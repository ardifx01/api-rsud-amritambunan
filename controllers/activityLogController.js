const ActivityLogs = require("../models/activityLogsModel");

const ActivityLogsController = {
    getAllActivityLogs: async (req, res) => {
        const {
            page = 1,
            limit = 10,
            search = '',
            method = '',
            created_at = '',
            start_date = '',
            end_date = '',
        } = req.query;

        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const offset = (pageNumber - 1) * limitNumber;

        // Siapkan filters untuk dikirim ke model
        const filters = {};

        if (created_at) filters.created_at = created_at;
        if (start_date && end_date) {
            filters.start_date = start_date;
            filters.end_date = end_date;
        }

        try {
            const activityLogs = await ActivityLogs.getAllWithPagination(limitNumber, offset, search, filters);
            const totalActivityLogs = await ActivityLogs.getTotalCount(search, filters);
            const totalPages = Math.ceil(totalActivityLogs / limitNumber);

            res.status(200).json({
                status: "success",
                message: "Activity Logs retrieved successfully",
                data: {
                    activityLogs,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalActivityLogs,
                        perPage: limitNumber,
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: "Failed to retrieve activity logs",
                data: { error: error.message },
            });
        }
    },
};

module.exports = ActivityLogsController;
