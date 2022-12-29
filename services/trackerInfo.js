import { dateFormat } from "../utils/dateFormat.js";
import { ErrorException } from "../utils/ErrorException.js";

export const generateTrackerInfo = async (
  user,
  store,
  cashback,
  partner,
  linkTrack,
  client
) => {
  const table = "tracker_info";
  const columns = `
    cashback_id,
    tienda_id, 
    usuario_id, 
    link_track_id, 
    partner_id, 
    is_iwana, 
    pais_id, 
    codigo_producto_carro,
    codigo_producto_carro_attr, 
    precio_producto_carro, 
    precio_producto_carro_attr,
    cantidad_producto_carro, 
    cantidad_producto_carro_attr,
    imagen_producto_carro, 
    imagen_producto_carro_attr,
    boton_carrito_carro, 
    boton_final_carro, 
    codigo_producto_en_producto, 
    codigo_producto_en_producto_attr,
    imagen_producto_en_producto, 
    imagen_producto_en_producto_attr,
    nombre_producto_en_producto, 
    nombre_producto_en_producto_attr,
    descripcion_producto_en_producto,
    descripcion_producto_en_producto_attr, 
    categoria_producto_en_producto,
    categoria_producto_en_producto_attr,
    boton_producto_en_producto, 
    codigo_producto_comprar,
    codigo_producto_comprar_attr,
    precio_producto_comprar, 
    precio_producto_comprar_attr,
    cantidad_producto_comprar, 
    cantidad_producto_comprar_attr, 
    boton_final_comprar, 
    codigo_orden_en_orden,
    codigo_orden_en_orden_attr,
    pagina_gracias, 
    link_carro,
    elemento_seleccionado, 
    parents, 
    created_at,
    updated_at
  `;
  const cashbackId = cashback ? cashback.id : null;
  const partnerId = partner ? partner.id : null;
  const isIwana = true;
  const trackerInfoConfig = getConfigStoreInfo(store);
  const valuesTrackerInfoConfig = Object.values(trackerInfoConfig)
    .map((value) => {
      if (!value) {
        return `${value}`;
      }
      return `'${value}'`;
    })
    .join(", ");
  const trackerInfo = {
    cashback_id: cashbackId,
    tienda_id: store.id,
    usuario_id: user.id,
    link_track_id: linkTrack.id,
    partner_id: partnerId,
    is_iwana: isIwana,
    pais_id: store.pais_id,
    created_at: dateFormat(new Date()),
    updated_at: dateFormat(new Date()),
  };
  const values = `
    ${trackerInfo.cashback_id},
    ${trackerInfo.tienda_id},
    ${trackerInfo.usuario_id},
    ${trackerInfo.link_track_id},
    ${trackerInfo.partner_id},
    ${trackerInfo.is_iwana},
    ${trackerInfo.pais_id},
    ${valuesTrackerInfoConfig},
    '${trackerInfo.created_at}',
    '${trackerInfo.updated_at}'
  `;
  const statement = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *;`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al registrar el tracker info",
      error: err,
    });
  }
};

const getConfigStoreInfo = (store) => {
  let trackerInfo = {};
  Object.assign(trackerInfo, {
    // Desde configuración 'en el carrito'
    codigo_producto_carro: store.code_prod,
    codigo_producto_carro_attr: store.code_prod_attr,
    precio_producto_carro: store.price_prod,
    precio_producto_carro_attr: store.price_prod_attr,
    cantidad_producto_carro: store.quantity_prod,
    cantidad_producto_carro_attr: store.quantity_prod_attr,
    imagen_producto_carro: store.cart_image_prod,
    imagen_producto_carro_attr: store.cart_image_prod_attr,
    boton_carrito_carro: store.actuator_cart,
    boton_final_carro: store.actuator_final,
    // Desde configuración 'en el producto'
    codigo_producto_en_producto: store.code_detail_prod,
    codigo_producto_en_producto_attr: store.code_detail_prod_attr,
    imagen_producto_en_producto: store.image_prod,
    imagen_producto_en_producto_attr: store.image_prod_attr,
    nombre_producto_en_producto: store.name_prod,
    nombre_producto_en_producto_attr: store.name_prod_attr,
    descripcion_producto_en_producto: store.description_prod,
    descripcion_producto_en_producto_attr: store.description_prod_attr,
    categoria_producto_en_producto: store.categories_prod,
    categoria_producto_en_producto_attr: store.categories_prod_attr,
    boton_producto_en_producto: store.actuator_product,
    // Desde configuración 'comprar producto'
    codigo_producto_comprar: store.code_prod_final,
    codigo_producto_comprar_attr: store.code_prod_final_attr,
    precio_producto_comprar: store.price_prod_final,
    precio_producto_comprar_attr: store.price_prod_final_attr,
    cantidad_producto_comprar: store.quantity_prod_final,
    cantidad_producto_comprar_attr: store.quantity_prod_final_attr,
    boton_final_comprar: store.actuator_product_final,
    // Desde configuración 'en la orden'
    codigo_orden_en_orden: store.orden_code,
    codigo_orden_en_orden_attr: store.orden_code_attr,
    pagina_gracias: store.link_final,
    // Desde configuración 'ni idea'
    link_carro: store.link_cart,
    elemento_seleccionado: store.element_select,
    parents: store.parents,
  });
  return trackerInfo;
};
export const generateLink = async (
  user,
  store,
  linkTrack,
  cashback,
  trackerInfo,
  storeConfigs
) => {
  const storeType = store.store_type_id;
  let stringLink = "";
  switch (storeType) {
    case 3: // Tienda Iwana
      stringLink = configureLinkStoreIwana(
        store,
        cashback,
        trackerInfo,
        storeConfigs
      );
      break;
    case 4: // Tienda ADMITAD
      stringLink = configureLinkStoreAdmitad(user, store, linkTrack, cashback);
      break;
    case 5: // Tienda Soicos
      stringLink = configureLinkStoreSoicos(user, store, linkTrack, cashback);
      break;
    case 6: // Tienda AWIN
      stringLink = configureLinkTiendaAwin(user, store, linkTrack, cashback);
      break;
    default:
      break;
  }
  return stringLink.replace('"', "'");
};

/**
 * Crea el link que se usa para las tiendas tipo Iwana, los datos son limpiados y luego
 * se realiza un encode para poder enviarlo y que pueda detectarlo el script tracking.
 *
 * @param TrackerInfo $trackerInfo
 *
 * @return string
 */

const configureLinkStoreIwana = (
  store,
  cashback,
  trackerInfo,
  storeConfigs
) => {
  const data = arrayDataForIwanaTrack(trackerInfo, store, storeConfigs);
  let stringLink = "";

  for (const [key, value] of Object.entries(data)) {
    const stringValue = value ? value.toString() : "null";
    const cleanValue = encodeURIComponent(stringValue.trim());
    const cleanName = encodeURIComponent(key.trim());
    stringLink += `${cleanName}=${cleanValue}&`;
  }

  // General el link, corta los bordes blancos y elimina el último caracter &
  const cleanLink = stringLink.trim().slice(0, -1);

  // Si existe cashback, retornar link de cashback
  if (cashback) {
    const urlTracker = cashback.link;
    return `${urlTracker}?${cleanLink}`;
  }

  // Si no existe cashback, retornar link de tienda
  const link = store.link;
  const lastCharacters = link.slice(-2);

  if ("??" === lastCharacters) {
    const position = link.indexOf("??");
    const routeFixed = link.substring(0, position);
    return `${routeFixed}&${cleanLink}`;
  }

  return `${link}?${cleanLink}`;
};

/**
 * Genera un link que se usa en las tiendas Admitad
 *
 * @param TrackerInfo $trackerInfo
 *
 * @return string
 */

const configureLinkStoreAdmitad = (user, store, linkTrack, cashback) => {
  const userId = user.id;
  const storeId = store.id;
  const linkTrackId = linkTrack.id;

  const userText = `subid=${userId}`;
  const storeText = `subid1=${storeId}`;
  const linkText = `subid3=${linkTrackId}`;

  const linkDataAffiliate = `${userText}&${storeText}&${linkText}`;
  const link = cashback ? cashback.link : store.link;
  return `${link}?${linkDataAffiliate}`;
};

/**
 * Genera un link que se usa en las tiendas Soicos
 *
 * @param TrackerInfo $trackerInfo
 *
 * @return string
 */
const configureLinkStoreSoicos = (user, store, linkTrack, cashback) => {
  const userId = user.id;
  const storeId = store.id;
  const linkTrackId = linkTrack.id;
  const userText = `trackerID=${userId}`;

  const linkDataAffiliate = `${userText};${storeId};${linkTrackId}`;

  if (!cashback) {
    const link = store.link;
    return `${link}?${linkDataAffiliate}`;
  }

  const link = cashback.link;
  const position = link.indexOf("?");
  if (!position) {
    return `${link}?${linkDataAffiliate}`;
  }

  const soicosUrl = link.substring(0, position);
  const route = link.substring(position + 1);

  return `${soicosUrl}?${linkDataAffiliate}&${route}`;
};

/**
 * Genera un link que se usa en las tiendas Awin
 *
 * @param TrackerInfo $trackerInfo
 *
 * @return string
 */

const configureLinkTiendaAwin = (user, store, linkTrack, cashback) => {
  const userId = user.id;
  const storeId = store.id;
  const linkTrackId = linkTrack.id;

  const userText = `clickref=${userId}`;
  const storeText = `clickref2=${storeId}`;
  const linkText = `clickref3=${linkTrackId}`;

  const linkDataAffiliate = `${userText}&${storeText}&${linkText}`;

  if (!cashback) {
    const link = store.link;
    return `${link}?${linkDataAffiliate}`;
  }

  const link = cashback.link;
  const position = link.indexOf("?");
  if (!position) {
    return `${link}?${linkDataAffiliate}`;
  }

  const awinURL = link.substring(0, position);
  const route = link.substring(position + 1);

  return `${awinURL}?${linkDataAffiliate}&${route}`;
};

const arrayDataForIwanaTrack = (trackerInfo, store, storeConfig) => {
  let data = {};
  Object.assign(data, {
    is_iwana: trackerInfo.is_iwana,
    store_id: trackerInfo.tienda_id,
    user_id: trackerInfo.user_id,
    "iwana-id-track": trackerInfo.link_track_id,
    id: storeConfig ? storeConfig.id : null,
    pais_id: trackerInfo.pais_id,
    link_final: trackerInfo.pagina_gracias,
    image_prod: trackerInfo.imagen_producto_en_producto,
    code_prod: trackerInfo.codigo_producto_carro,
    name_prod: trackerInfo.nombre_producto_en_producto,
    description_prod: trackerInfo.descripcion_producto_en_producto,
    price_prod: trackerInfo.precio_producto_carro,
    quantity_prod: trackerInfo.cantidad_producto_carro,
    created_at: trackerInfo.created_at,
    updated_at: trackerInfo.updated_at,
    link_cart: trackerInfo.link_carro,
    image_prod_attr: trackerInfo.imagen_producto_en_producto_attr,
    code_prod_attr: trackerInfo.codigo_producto_carro_attr,
    name_prod_attr: trackerInfo.nombre_producto_en_producto_attr,
    description_prod_attr: trackerInfo.descripcion_producto_en_producto_attr,
    price_prod_attr: trackerInfo.precio_producto_comprar_attr,
    quantity_prod_attr: trackerInfo.cantidad_producto_carro_attr,
    actuator_cart: trackerInfo.boton_carrito_carro,
    actuator_final: trackerInfo.boton_final_carro,
    orden_code: trackerInfo.codigo_orden_en_orden,
    orden_code_attr: trackerInfo.codigo_orden_en_orden_attr,
    categories_prod: trackerInfo.categoria_producto_en_producto,
    categories_prod_attr: trackerInfo.categoria_producto_en_producto_attr,
    code_detail_prod: trackerInfo.codigo_producto_en_producto,
    code_detail_prod_attr: trackerInfo.codigo_producto_en_producto_attr,
    actuator_product: trackerInfo.boton_producto_en_producto,
    element_select: trackerInfo.elemento_seleccionado,
    parents: trackerInfo.parents,
    actuator_product_final: trackerInfo.boton_final_comprar,
    price_prod_final: trackerInfo.precio_producto_comprar,
    price_prod_final_attr: trackerInfo.precio_producto_comprar_attr,
    quantity_prod_final: trackerInfo.cantidad_producto_comprar,
    quantity_prod_final_attr: trackerInfo.cantidad_producto_comprar_attr,
    code_prod_final: trackerInfo.codigo_producto_comprar,
    code_prod_final_attr: trackerInfo.codigo_producto_comprar_attr,
    cart_image_prod: trackerInfo.imagen_producto_carro,
    cart_image_prod_attr: trackerInfo.imagen_producto_carro_attr,
    link: store.url_store,
  });
  return trackerInfo;
};
