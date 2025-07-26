//buatkan saya controller untuk menampilkan data setting hanya satu data
const Setting = require("../models/settingModels");

const SettingController = {
    get: async (req, res) => {
        try {
            const settings = await Setting.get();
            res.status(200).send({
                status: "success",
                message: "Setting retrieved successfully",
                data: settings || {}
            });
        } catch (error) {
            res.status(500).send({
                status: "error",
                message: error.message,
                data: {}
            });
        }
    },

    //buatkan saya update data setting hanya sati data
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const updatedSettings = await Setting.update(id, data);

            if (Object.keys(updatedSettings).length > 0) {
                res.status(200).json({
                    status: "success",
                    message: "Setting updated successfully",
                    data: updatedSettings
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: "Setting not found",
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

module.exports = SettingController;