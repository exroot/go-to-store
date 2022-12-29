import { ErrorException } from "../utils/ErrorException.js";

export const getStoreConfigs = async (store, client) => {
  const table = "store_configs";
  const columns = "*";
  const conditions = `store_id = ${store.id}`;
  const statement = `SELECT ${columns} FROM ${table} WHERE ${conditions};`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults?.rows[0];
    if (!results) {
      return null;
    }
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al buscar el store config",
      error: err,
    });
  }
};
