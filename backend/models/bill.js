const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

class Bill extends Model {}

Bill.init(
    {
        bill_number: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        subtotal: { 
            type: DataTypes.DECIMAL(10, 2) 
        },
        gst: { 
            type: DataTypes.DECIMAL(10, 2) 
        },
        gst_rate: { 
            type: DataTypes.DECIMAL(5, 2) 
        },
        total: { 
            type: DataTypes.DECIMAL(10, 2) 
        },
        billed_user: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        payload_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        servicecharge: { 
            type: DataTypes.DECIMAL(5, 2) 
        },
        servicechargeamount: { 
            type: DataTypes.DECIMAL(10, 2) 
        },
        timestamp: { 
            type: DataTypes.DATE, 
            defaultValue: Sequelize.literal('NOW() AT TIME ZONE \'Asia/Kolkata\'')
        }
    },
    {
        sequelize,
        modelName: 'Bill',
        tableName: 'bills',
        timestamps: false
    }
);

// Composite key definition for Sequelize
Bill.removeAttribute('id'); // Disable default primary key
Bill.primaryKeyAttributes = ['user_id', 'bill_number'];

module.exports = Bill;
