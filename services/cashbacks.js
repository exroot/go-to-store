import { ErrorException } from "../utils/ErrorException.js";

export const getCashbackByIdAndStore = async (cashbackId, store, client) => {
  const table = "cashbacks";
  const columns = "*";
  const conditions = `id = ${cashbackId} AND store_id = ${store?.id}`;
  const statement = `SELECT ${columns} FROM ${table} WHERE ${conditions};`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    if (!results) {
      throw new ErrorException({
        httpStatus: 404,
        message: "Cashback no encontrado",
        error: "Cashback no encontrado",
      });
    }
    return results;
  } catch (err) {
    console.log("ERROR: ", err);
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al buscar el cashback",
      error: err,
    });
  }
};
