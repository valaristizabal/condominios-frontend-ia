# Condominios Frontend IA

Frontend React + Vite para la operacion multi-condominio.

## Regla principal de tenant

- El frontend no debe enviar `condominium_id` en queries ni payloads.
- El tenant se opera con el contexto activo.
- Para usuarios de plataforma en contexto tenant se usa el header `X-Active-Condominium-Id`.

## Tipos de unidad parametrizables

La UI ya no depende del nombre del tipo de unidad para decidir comportamiento.

Cada tipo de unidad trae dos flags desde backend:

- `allows_residents`
- `requires_parent`

## Como funciona en pantalla

### Tipos de unidad

En `Settings > Tipos de unidad` se configura:

- nombre visible del tipo
- si permite residentes directos
- si depende de un inmueble principal

### Inmuebles

En `Settings > Inmuebles`:

- si el tipo tiene `requires_parent = true`, el formulario pide `Inmueble principal`
- si el tipo tiene `requires_parent = false`, no debe tener padre
- si el tipo tiene `allows_residents = true`, se considera unidad principal para residentes

### Residentes

En `Settings > Residentes`:

- solo se muestran como seleccionables los inmuebles cuyo tipo tenga `allows_residents = true`
- las unidades hijas se muestran como relacionadas al inmueble principal
- el formulario incluye:
  - `administration_fee`
  - `administration_due_day` (dia del mes entre 1 y 31)
- si el tipo es `arrendatario`, se habilitan campos del propietario:
  - `property_owner_full_name`
  - `property_owner_document_number`
  - `property_owner_email`
  - `property_owner_phone`
  - `property_owner_birth_date`
- si el tipo cambia a `propietario`, los datos `property_owner_*` se limpian automaticamente
- el listado de residentes muestra `administration_fee` y referencia de propietario cuando exista

### Recaudo y cartera

En `Operacion > Recaudo y Cartera`:

- el boton `Generar cartera` ejecuta `POST /api/portfolio/generate-current`
- el frontend no envia `period`; el mes lo calcula el backend con la fecha del servidor
- despues de generar, la pantalla refresca resumen, estado de cartera e historial de recaudos
- el historial usa `evidence_url` para abrir comprobantes con `window.open(...)`
- si `evidence_url` es nulo, la UI muestra aviso y no intenta abrir ruta interna
- la tabla `Estado de cartera` muestra:
  - `Dia de corte`
  - `Deuda actual` (al lado de dia de corte)
- `Deuda actual` se obtiene desde `GET /api/residents/debt-summary` y se cruza por unidad/apartamento

## Ejemplo de uso

1. Crear `Apartamento` con:
   - `allows_residents = true`
   - `requires_parent = false`
2. Crear `Parqueadero visitantes` con:
   - `allows_residents = false`
   - `requires_parent = true`
3. Crear `A101`
4. Crear `PQ-12` asociado a `A101`
5. Registrar residente en `A101`

No se registra residente directamente en `PQ-12`.
