import mongoose from 'mongoose';

export const DEFAULT_CATEGORY_NAME = 'Uncategorized';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    // The default category receives expenses whose category gets deleted. It can't be renamed or removed.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Case-insensitive uniqueness, for example, "Food" and "food" are the same category
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

categorySchema.methods.toPublic = function toPublic() {
  return { id: this._id.toString(), name: this.name, isDefault: this.isDefault };
};

export const Category = mongoose.model('Category', categorySchema);
