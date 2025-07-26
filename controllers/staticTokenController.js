//buatkan saya controller untuk menampilkan data setting hanya satu data
const StaticToken = require("../models/staticTokenModel");

const StaticTokenController = {
    get: async (req, res) => {
        try {
            const staticToken = await StaticToken.get();
            res.status(200).send({
                status: "success",
                message: "Static token retrieved successfully",
                data: staticToken || {}
            });
        } catch (error) {
            res.status(500).send({
                status: "error",
                message: error.message,
                data: {}
            });
        }
    },

    updateToken: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const staticToken = await StaticToken.update(id, data);

            if (Object.keys(staticToken).length > 0) {
                res.status(200).json({
                    status: "success",
                    message: "Static token updated successfully",
                    data: staticToken
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: "Static token not found",
                    data: {}
                });
            }
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
                data: {}
            });
        }
    },
};

module.exports = StaticTokenController;