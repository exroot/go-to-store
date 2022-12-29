import { ErrorException } from "../utils/ErrorException.js";

export const getStoreById = async (partnerId, client) => {
  const table = "stores";
  const columns = `${table}.*, store_configs.*, countries.name as country`;
  const conditions = `stores.id = ${partnerId}`;
  const statement = `SELECT ${columns} FROM ${table} INNER JOIN countries on stores.pais_id = countries.id INNER JOIN store_configs ON stores.id = store_configs.store_id WHERE ${conditions};`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    if (!results) {
      throw new ErrorException({
        httpStatus: 404,
        message: "Tienda no encontrada",
        error: "Tienda no encontrada",
      });
    }
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al buscar la tienda",
      error: err,
    });
  }
};
