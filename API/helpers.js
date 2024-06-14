
const errorHandler = (error, context) => {
    console.error(`Error in ${context}:`, error);
};

module.exports = {
    errorHandler,
};
