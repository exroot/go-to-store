import { ErrorException } from "../utils/ErrorException.js";

export const getPartnerById = async (partnerId, client) => {
  const table = "partners";
  const columns = "*";
  const conditions = `id = ${partnerId}`;
  const statement = `SELECT ${columns} FROM ${table} WHERE ${conditions}`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    if (!results) {
      throw new ErrorException({
        httpStatus: 404,
        message: "Partner no encontrado",
        error: "Partner no encontrado",
      });
    }
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al buscar el partner",
      error: err,
    });
  }
};
