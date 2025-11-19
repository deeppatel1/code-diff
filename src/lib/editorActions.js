export const sortModelJson = ({ model, beautifier, indentSize }) => {
  if (!model) {
    throw new Error('Model is required to sort JSON content');
  }

  if (!beautifier) {
    throw new Error('CodeBeautifier instance is required to sort JSON content');
  }

  const sorted = beautifier.sortJson(model.getValue(), { indentSize });
  model.setValue(sorted);
  return sorted;
};
