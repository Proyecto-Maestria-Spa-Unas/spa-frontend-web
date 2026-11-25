/**
 * Encabezado de pantalla (F16): círculo con ícono, nombre de la marca, título y descripción.
 * Es el mismo diseño de Inventario, para que todas las pantallas se vean igual.
 * `icono` recibe el contenido del <svg> (trazos de 24x24); es decorativo y se oculta a lectores de pantalla.
 * `acciones` es opcional (por ejemplo, un botón «Nuevo…») y queda a la derecha.
 */
export function EncabezadoPagina({ icono, titulo, descripcion, acciones }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-marca-acento bg-marca-enfoque">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-marca-primario"
          aria-hidden="true"
        >
          {icono}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario-hover">NAILSSPA</p>
        <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-marca-primario-hover">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-marca-texto">{descripcion}</p>}
      </div>
      {acciones}
    </div>
  );
}
