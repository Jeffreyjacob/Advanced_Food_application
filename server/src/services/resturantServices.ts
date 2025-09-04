import mongoose from 'mongoose';
import {
  IMenuCategoryMutation,
  IMenuCategoryQuery,
  IMenuItemMutation,
  IMenuItemQuery,
  IRestaurantMutation,
} from '../interface/interface/interface';
import {
  IBaseUser,
  IMenuCategory,
  IMenuItem,
  IRestaurant,
  IRestaurantOwner,
} from '../interface/models/models';
import { Restaurant } from '../models/restaurant';
import { AppError } from '../utils/appError';
import { DocumentStatusEnum, RoleEnums } from '../interface/enums/enums';
import { DocumentValidatorQueue } from '../queue/documentValidator/queue';
import { RestaurantOwner } from '../models/restaurantOwner';
import MenuCategory from '../models/menuCategory';
import { MenuItem } from '../models/menuItem';

export class RestaurantServies {
  async updateRestaurantInfo({
    restaurantOwnerId,
    data,
  }: {
    restaurantOwnerId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['updateRestaurant'];
  }) {
    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (['locationCoord'].includes(key)) {
        updateData['traceableLocation.coordinates'] = value;
      } else {
        updateData[key] = value;
      }
    });

    const updateRestaurant = await Restaurant.findOneAndUpdate(
      {
        owner: restaurantOwnerId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateRestaurant) {
      throw new AppError(
        'Unable to update restaurant at the moment, try again later',
        400
      );
    }

    return {
      message: 'resturant info updated',
      data: updateRestaurant,
    };
  }

  async createRestaurantDocument({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['addRestaurantDocument'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError("a restaurant can't be found for this user", 404);
    }

    if (findRestaurant.documents[data.documentType].url) {
      throw new AppError(
        `${data.documentType} document already exist in your document report, You can only update document`,
        400
      );
    }

    const documents: any = {};

    documents[`documents.${data.documentType}.url`] = data.url;
    documents[`documents.${data.documentType}.status`] =
      DocumentStatusEnum.Pending;

    const updateRestaurantDocument = await Restaurant.findByIdAndUpdate(
      findRestaurant._id,
      {
        $set: documents,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updateRestaurantDocument) {
      throw new AppError('Unable to update restaurant document', 400);
    }

    await DocumentValidatorQueue.add(
      'verify document ',
      {
        userId: userId,
        DocumentData: data,
        businessName: findRestaurant.name,
      },
      {
        delay: 4 * 60 * 1000,
      }
    );

    return {
      message: 'Document has been uploaded',
    };
  }

  async updateRestaurantDocument({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['updateRestaurantDocument'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError("a restaurant can't be found for this user", 404);
    }

    if (!findRestaurant.documents[data.documentType].url) {
      throw new AppError(
        'you have no document file to update, please add new document before updating ',
        400
      );
    }

    const expiryDate =
      findRestaurant.documents[data.documentType] &&
      findRestaurant.documents[data.documentType].expiryDate;
    const documentExpiryDate = expiryDate ? new Date(expiryDate) : null;
    let oneMonthBeforeExpiryDate: Date | null = null;
    if (documentExpiryDate) {
      oneMonthBeforeExpiryDate = new Date(
        documentExpiryDate.getFullYear(),
        documentExpiryDate.getMonth() - 1,
        documentExpiryDate.getDate()
      );
    }

    // only update approved document, when it's one month before the document expiry date
    if (
      oneMonthBeforeExpiryDate &&
      findRestaurant.documents[data.documentType].status ===
        DocumentStatusEnum.Approved &&
      new Date().getTime() >= oneMonthBeforeExpiryDate.getTime()
    ) {
      const updateDocument = await Restaurant.findOneAndUpdate(
        {
          owner: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            [`documents.${data.documentType}.url`]: data.url,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updateDocument) {
        throw new AppError('Unable to update document, try again', 400);
      }

      await DocumentValidatorQueue.add('verify document ', {
        userId: userId,
        DocumentData: data,
        businessName: findRestaurant.name,
      });
    } else if (
      findRestaurant.documents[data.documentType].status !==
      DocumentStatusEnum.Approved
    ) {
      const updateDocument = await Restaurant.findOneAndUpdate(
        {
          owner: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            [`documents.${data.documentType}.url`]: data.url,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updateDocument) {
        throw new AppError('Unable to update document, try again', 400);
      }

      await DocumentValidatorQueue.add(
        'verify document ',
        {
          userId: userId,
          DocumentData: data,
          businessName: findRestaurant.name,
        },
        {
          delay: 4 * 60 * 1000,
        }
      );
    } else if (
      oneMonthBeforeExpiryDate &&
      findRestaurant.documents[data.documentType].status ===
        DocumentStatusEnum.Approved &&
      new Date().getTime() < oneMonthBeforeExpiryDate.getTime()
    ) {
      throw new AppError(
        "You can't updated approved document or else it's one month before the document expiry date",
        400
      );
    }

    return {
      message: 'Document updated successfuly, will be revalidated',
    };
  }

  async getRestaurantDetail({
    userId,
  }: {
    userId: IRestaurantOwner['_id'];
  }): Promise<IRestaurant> {
    const findRestaurantOwner = await RestaurantOwner.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurantOwner) {
      throw new AppError('Restaurant owner not found', 404);
    }

    const findRestaurant = await Restaurant.findOne({
      owner: findRestaurantOwner._id,
    }).populate({ path: 'owner', select: 'email firstName lastName _id' });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found ', 404);
    }

    return findRestaurant;
  }

  async createMenuCategory({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IMenuCategoryMutation['createCategory'];
  }) {
    // find restaurant with restauarant owner id

    const restaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!restaurant) {
      throw new AppError('restaurant not found', 404);
    }

    const lastMenuCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
    }).sort({ displayOrder: -1 });

    const displayOrder = lastMenuCategory
      ? lastMenuCategory.displayOrder + 1
      : 1;

    const menuCategory = await MenuCategory.create({
      restaurantId: restaurant._id,
      ...data,
      displayOrder,
    });

    return {
      message: 'Menu Category created successfully!',
    };
  }

  async updateMenuCategory({
    userId,
    categoryId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    categoryId: IMenuCategory['_id'];
    data: IMenuCategoryMutation['updateCategory'];
  }) {
    const name = data.name && {
      name: data.name,
    };

    const description = data.description && {
      description: data.description,
    };

    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const findAndupdateCategory = await MenuCategory.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(categoryId),
        restaurantId: findRestaurant._id,
      },
      {
        $set: {
          ...name,
          ...description,
        },
      },
      {
        new: true,
      }
    );

    if (!findAndupdateCategory) {
      throw new AppError('Unable to update menu category', 400);
    }

    return {
      message: 'Menu category updated successfully!',
    };
  }

  async deleteMenuCategory({
    userId,
    categoryId,
  }: {
    userId: IRestaurantOwner['_id'];
    categoryId: IMenuCategory['_id'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('restaurant not found', 404);
    }

    const findAndDeleteCategory = await MenuCategory.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(categoryId),
      restaurantId: findRestaurant._id,
    });

    if (!findAndDeleteCategory) {
      throw new AppError('Unable to delete menu category', 400);
    }

    return {
      message: 'Menue category has been deleted successfully!',
    };
  }

  async updateMenuCategoryDisplayOrder({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IMenuCategoryMutation['updateDisplayOrder'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const checkCategoryId = await Promise.all(
      data.newOrderCategory.map(async (categoryId) => {
        return await MenuCategory.findById(categoryId);
      })
    );

    const findCategory = checkCategoryId.filter(
      (category) => category !== null
    );

    if (
      data.newOrderCategory &&
      data.newOrderCategory.length > 0 &&
      findCategory.length !== data.newOrderCategory.length
    ) {
      const notFoundIds = data.newOrderCategory.filter(
        (caetgory, index) => checkCategoryId[index] === null
      );
      throw new AppError(
        `one of the category ${notFoundIds.join(', ')} which you provided  was not found in this restuarant menu categor`,
        400
      );
    }

    const operation = data.newOrderCategory.map((category, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(category) },
        update: { $set: { displayOrder: index + 1 } },
      },
    }));

    const updateMenuCategory = await MenuCategory.bulkWrite(operation);

    if (!updateMenuCategory) {
      throw new AppError('unable to update menu category', 400);
    }

    return {
      message: 'display order of menu category updated successfully!',
    };
  }

  async toggleMenUCategoryStatus({
    userId,
    categoryId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    categoryId: IMenuCategory['_id'];
    data: IMenuCategoryMutation['toggleCategoryStatus'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const updateMenuCategory = await MenuCategory.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(categoryId),
        restaurantId: findRestaurant._id,
      },
      {
        $set: {
          isActive: data.isActive,
        },
      },
      {
        new: true,
      }
    );

    if (!updateMenuCategory) {
      throw new AppError('Unable to update menu category', 400);
    }

    return {
      message: 'Menu category updated successfully!',
    };
  }

  async getAllMenuCategory({
    userId,
  }: {
    userId: IRestaurantOwner['_id'];
  }): Promise<IMenuCategory[]> {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was found', 404);
    }

    const menuCategory = await MenuCategory.find({
      restaurantId: findRestaurant._id,
    }).sort({ displayOrder: -1 });

    return menuCategory;
  }

  async getActiveMenuCategory({
    userId,
  }: {
    userId: IRestaurantOwner['_id'];
  }): Promise<IMenuCategory[]> {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was found', 404);
    }

    const menuCategory = await MenuCategory.find({
      restaurantId: findRestaurant._id,
      isActive: true,
    }).sort({ displayOrder: -1 });

    return menuCategory;
  }

  async createMenuItem({
    userId,
    data,
  }: {
    userId: IRestaurant['_id'];
    data: IMenuItemMutation['createMenuItem'];
  }) {
    const { menuCategoryId, ...otherData } = data;
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const menuCategory = await MenuCategory.findById(menuCategoryId);

    if (!menuCategory) {
      throw new AppError('Menu Category not found', 404);
    }

    const lastMenuItem = await MenuItem.findOne({
      restaurantId: findRestaurant._id,
    }).sort({ displayOrder: -1 });

    const displayOrder = lastMenuItem ? lastMenuItem.displayOrder + 1 : 1;

    await MenuItem.create({
      restaurantId: findRestaurant._id,
      categoryId: menuCategory._id,
      ...otherData,
      displayOrder,
    });

    return {
      message: 'Menu item created successfully!',
    };
  }
  async updateMenuItem({
    userId,
    menuItemId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    menuItemId: IMenuItem['_id'];
    data: IMenuItemMutation['updateMenuItem'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('restaurant was not found', 404);
    }

    const updateData: any = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'menuCategoryId') {
        updateData['categoryId'] = new mongoose.Types.ObjectId(value as string);
      } else {
        updateData[key] = value;
      }
    });

    console.log(updateData, 'updateData');

    const updateMenuItem = await MenuItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(menuItemId),
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    if (!updateMenuItem) {
      throw new AppError('Unable to update menu item', 400);
    }

    return {
      message: 'Menu item updated successfully!',
    };
  }

  async updateMenuItemDisplayOrder({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IMenuItemMutation['updateDisplayOrder'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('restaurant was not found', 404);
    }

    const checkMenuItemId = await Promise.all(
      data.newOrderMenuItem.map(async (itemId) => {
        return await MenuItem.findOne({
          _id: new mongoose.Types.ObjectId(itemId),
          restaurantId: findRestaurant._id,
        });
      })
    );

    const findMenuItem = checkMenuItemId.filter((item) => item !== null);

    if (
      data.newOrderMenuItem &&
      data.newOrderMenuItem.length > 0 &&
      findMenuItem.length !== data.newOrderMenuItem.length
    ) {
      const notFoundItemId = data.newOrderMenuItem.filter(
        (item, index) => checkMenuItemId[index] === null
      );

      throw new AppError(
        `menu item id ${notFoundItemId.join(',')} was not found in your restaurant`,
        400
      );
    }

    const operation = data.newOrderMenuItem.map((itemId, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(itemId) },
        update: { $set: { displayOrder: index + 1 } },
      },
    }));

    const updateMenuItem = await MenuItem.bulkWrite(operation);

    if (!updateMenuItem) {
      throw new AppError('Unable to update menu items', 400);
    }

    return {
      message: 'display order of menu item has updated successfully!',
    };
  }

  async toggleMenuItemStatus({
    userId,
    menuItemId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    menuItemId: IMenuItem['_id'];
    data: IMenuItemMutation['toggleStatus'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const updateMenuItem = await MenuItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(menuItemId),
        restaurantId: findRestaurant._id,
      },
      {
        $set: {
          isAvailable: data.isAvaliable,
        },
      },
      {
        new: true,
      }
    );

    if (!updateMenuItem) {
      throw new AppError('Unable to update menu item', 400);
    }

    return {
      message: 'Menu item updated successfully!',
    };
  }

  async deleteMenuItem({
    userId,
    menuItemId,
  }: {
    userId: IRestaurantOwner['_id'];
    menuItemId: IMenuItem['_id'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const menuItem = await MenuItem.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(menuItemId),
      restaurantId: findRestaurant._id,
    });

    if (!menuItem) {
      throw new AppError('Unable to delete menu item', 400);
    }

    return {
      message: 'Menu item deleted successfully!',
    };
  }

  async getMenuItemByCategoryId({
    userId,
    categoryId,
  }: {
    userId: IBaseUser['_id'];
    categoryId: IMenuCategory['_id'];
  }): Promise<IMenuItem[]> {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const menuCategory = await MenuCategory.findOne({
      _id: new mongoose.Types.ObjectId(categoryId),
      restaurantId: findRestaurant._id,
    });

    if (!menuCategory) {
      throw new AppError('Menu category was not found', 404);
    }

    const menuItems = await MenuItem.find({
      categoryId: menuCategory._id,
    }).sort({ displayOrder: -1 });

    return menuItems;
  }

  async getMenuItemById({
    menuItemId,
    userId,
  }: {
    menuItemId: IMenuItem['_id'];
    userId: IRestaurantOwner['_id'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const menuItem = await MenuItem.findOne({
      _id: new mongoose.Types.ObjectId(menuItemId),
      restaurantId: findRestaurant._id,
    }).populate({ path: 'categoryId', select: '_id name description' });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    return menuItem;
  }

  async getActiveMenuItems({
    userId,
    data,
  }: {
    userId: IBaseUser['_id'];
    data: IMenuItemQuery['getActiveMenuItem'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const query = {
      isAvailable: true,
      restaurantId: findRestaurant._id,
    };

    const page = data.page || 1;
    const limit = data.limit || 10;

    const skip = (page - 1) * limit;

    const totalCount = await MenuItem.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);

    const activeMenuItem = await MenuItem.find(query)
      .skip(skip)
      .sort({
        displayOrder: -1,
      })
      .limit(limit);

    return {
      data: activeMenuItem,
      currentPage: page,
      totalPages,
      total: totalCount,
    };
  }

  async getAllMenuItems({
    userId,
    data,
  }: {
    userId: IBaseUser['_id'];
    data: IMenuItemQuery['getAllMenuItem'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const query = {
      restaurantId: findRestaurant._id,
    };

    const page = data.page || 1;
    const limit = data.limit || 10;

    const skip = (page - 1) * limit;
    const totalCount = await MenuItem.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const menuItems = await MenuItem.find(query)
      .skip(skip)
      .sort({ displayOrder: -1 })
      .limit(limit);

    return {
      data: menuItems,
      currentPage: page,
      totalPages,
      total: totalCount,
    };
  }

  async SearchMenuItems({
    userId,
    data,
  }: {
    userId: IBaseUser['_id'];
    data: IMenuItemQuery['SearchMenuItem'];
  }) {
    const name = data.name && {
      name: { $regex: data.name, $options: 'i' },
    };

    const minPrice = data.minPrice && {
      price: {
        $gte: data.minPrice,
      },
    };

    const maxPrice = data.maxPrice && {
      price: {
        $lte: data.maxPrice,
      },
    };

    const isSpicy = data.isSpicy && {
      isSpicy: data.isSpicy,
    };

    const isVegan = data.isVegan && {
      isVegan: data.isVegan,
    };

    const isVegetarian = data.isVegetarian && {
      isVegetarain: data.isVegetarian,
    };

    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError('Restaurant was not found ', 404);
    }

    const query = {
      isAvailable: true,
      restaurantId: findRestaurant._id,
      ...name,
      ...minPrice,
      ...maxPrice,
      ...isSpicy,
      ...isVegan,
      ...isVegetarian,
    };

    console.log(query);

    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;
    const totalCount = await MenuItem.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const menuItems = await MenuItem.find(query)
      .skip(skip)
      .sort({ displayOrder: -1 })
      .limit(limit);

    return {
      data: menuItems,
      currentPage: page,
      totalPages,
      total: totalCount,
    };
  }
}
