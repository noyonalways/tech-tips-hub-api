import httpStatus from "http-status";
import { QueryBuilder } from "../../builder";
import { AppError } from "../../errors";
import { categorySearchableFields } from "./category.constant";
import { ICategory } from "./category.interface";
import Category from "./category.model";

const create = async (payload: ICategory) => {
  const category = await Category.findOne({ name: payload.name });
  if (category) {
    throw new AppError(httpStatus.CONFLICT, "Category already exists");
  }

  return Category.create(payload);
};

const getAll = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(Category.find(), query)
    .search(categorySearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await categoryQuery.modelQuery;
  const meta = await categoryQuery.countTotal();

  return { result, meta };
};

const getSingleCategory = async (id: string) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const deleteSingleCategory = async (id: string) => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isDeleted: true },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

export const categoryService = {
  create,
  getAll,
  getSingleCategory,
  deleteSingleCategory,
};
