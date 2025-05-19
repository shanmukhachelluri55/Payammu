const Item = require('../models/itemModel');
const { Op } = require('sequelize');

// Fetch items
exports.getItems = async (req, res) => {
  try {
    const { userId } = req.query;
    const queryOptions = {
      where: userId ? { userId } : {},
      order: [['category', 'ASC'], ['name', 'ASC'], ['subVariant', 'ASC']]
    };

    const items = await Item.findAll(queryOptions);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items', error: err.message });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  const transaction = await Item.sequelize.transaction();
  try {
    let { name, price, image, category, available, userId, minStock, stockPosition, subVariant } = req.body;
    
    subVariant = subVariant ? subVariant.trim() : null; // Trim spaces & handle null

    // Check for duplicate variant
    const existingVariant = await Item.findOne({
      where: {
        [Op.and]: [
          { name },
          { category },
          { userId },
          {
            [Op.or]: [
              { subVariant: subVariant }, // Match if subVariant is the same
              { subVariant: null } // Prevent null conflict issues
            ]
          }
        ]
      },
      transaction,
      lock: true
    });

    if (existingVariant) {
      if (transaction.finished !== 'rollback') await transaction.rollback();
      return res.status(400).json({ message: 'A variant with this name already exists for this user' });
    }

    const newItem = await Item.create(
      { name, price, image, category, available, userId, minStock, stockPosition, subVariant },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json(newItem);
  } catch (err) {
    if (transaction.finished !== 'rollback') await transaction.rollback();
    res.status(500).json({ message: 'Error creating item', error: err.message });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  const transaction = await Item.sequelize.transaction();
  try {
    const item = await Item.findByPk(req.params.id, { transaction, lock: true });

    if (!item) {
      if (transaction.finished !== 'rollback') await transaction.rollback();
      return res.status(404).json({ message: 'Item not found' });
    }

    let { name, price, image, category, available, minStock, stockPosition, subVariant } = req.body;
    subVariant = subVariant ? subVariant.trim() : null;

    // Check for duplicate variant only if name, category, or subVariant is changed
    if (
      (name && name !== item.name) ||
      (category && category !== item.category) ||
      (subVariant && subVariant !== item.subVariant)
    ) {
      const existingVariant = await Item.findOne({
        where: {
          [Op.and]: [
            { name: name || item.name },
            { category: category || item.category },
            { userId: item.userId },
            {
              [Op.or]: [
                { subVariant: subVariant || item.subVariant },
                { subVariant: null }
              ]
            },
            { id: { [Op.ne]: item.id } }
          ]
        },
        transaction,
        lock: true
      });

      if (existingVariant) {
        if (transaction.finished !== 'rollback') await transaction.rollback();
        return res.status(400).json({ message: 'A variant with this name already exists for this user' });
      }
    }

    // Update the item
    await item.update(
      { name, price, image: image || item.image, category, available, minStock, stockPosition, subVariant },
      { transaction }
    );

    await transaction.commit();
    res.json(item);
  } catch (err) {
    if (transaction.finished !== 'rollback') await transaction.rollback();
    res.status(500).json({ message: 'Error updating item', error: err.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  const transaction = await Item.sequelize.transaction();
  try {
    const item = await Item.findByPk(req.params.id, { transaction, lock: true });

    if (!item) {
      if (transaction.finished !== 'rollback') await transaction.rollback();
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy({ transaction });
    await transaction.commit();
    res.status(204).send();
  } catch (err) {
    if (transaction.finished !== 'rollback') await transaction.rollback();
    res.status(500).json({ message: 'Error deleting item', error: err.message });
  }
};
