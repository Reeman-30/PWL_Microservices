"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("books", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            author: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            rating: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: true,
                defaultValue: 0.0,
            },
            views: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            is_free: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            language: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: "English",
            },
            sinopsis: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            story: {
                type: Sequelize.TEXT("long"),
                allowNull: false,
            },
            image: {
                type: Sequelize.STRING(500),
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal(
                    "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
                ),
            },
        });
        // Add indexes
        await queryInterface.addIndex("books", ["title"]);
        await queryInterface.addIndex("books", ["author"]);
        await queryInterface.addIndex("books", ["is_free"]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("books");
    },
};
