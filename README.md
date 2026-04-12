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
