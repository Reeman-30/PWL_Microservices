"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Book extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Book.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: "Title cannot be empty",
                    },
                    len: {
                        args: [3, 255],
                        msg: "Title must be between 3 and 255 characters",
                    },
                },
            },
            author: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: "Author cannot be empty",
                    },
                },
            },
            rating: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                defaultValue: 0.0,
                validate: {
                    min: {
                        args: [0],
                        msg: "Rating must be at least 0",
                    },
                    max: {
                        args: [5],
                        msg: "Rating cannot exceed 5",
                    },
                },
            },
            views: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
                validate: {
                    min: {
                        args: [0],
                        msg: "Views cannot be negative",
                    },
                },
            },
            is_free: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            language: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "English",
                validate: {
                    notEmpty: {
                        msg: "Language cannot be empty",
                    },
                },
            },
            sinopsis: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: "Sinopsis cannot be empty",
                    },
                    len: {
                        args: [10, 1000],
                        msg: "Sinopsis must be between 10 and 1000 characters",
                    },
                },
            },
            story: {
                type: DataTypes.TEXT("long"),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: "Story cannot be empty",
                    },
                    len: {
                        args: [50],
                        msg: "Story must be at least 50 characters",
                    },
                },
            },
            image: {
                type: DataTypes.STRING(500),
                allowNull: true,
                validate: {
                    isUrl: {
                        msg: "Image must be a valid URL",
                    },
                },
            },
        },
        {
            sequelize,
            modelName: "Book",
            tableName: "books",
            timestamps: true,
            underscored: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    );
    return Book;
};
