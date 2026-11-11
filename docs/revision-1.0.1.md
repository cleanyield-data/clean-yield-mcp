# Revisión independiente de clean-yield-mcp 1.0.1 (11/11/2026)

Revisor: un agente distinto al que lo construyó. Rama `fix/list-without-token`, commit revisado 410b9c2, comparado contra `main`.

## Veredicto: **APTO**

No hay errores graves. Quedan 4 observaciones menores que no bloquean (ver al final).

## 1. Protocolo MCP: OK

Imagen construida desde el Dockerfile del repo. Por el proxy de este entorno, la copia de prueba suma 2 líneas para el certificado (`COPY ca-bundle.crt` + `NODE_EXTRA_CA_CERTS`). Corrida con `docker run -i --rm --network none` y **sin clave**, exit 0, en 0,6 s:

| Mensaje enviado | Respuesta |
|---|---|
| `initialize` con `2025-11-25` | `protocolVersion: 2025-11-25`, `capabilities.tools`, `serverInfo` clean-yield 1.0.1 |
| `initialize` con `1999-01-01` | `2025-06-18` (la que soporta) |
| `notifications/initialized` / `notifications/whatever` | sin respuesta (correcto) |
| `ping` | `{}` |
| `tools/list` | **5 herramientas** (81 KB completos, sin cortes) |
| `foo/bar` | error `-32601` |
| JSON inválido | error `-32700`, `id: null` |
| mensaje sin `jsonrpc` | error `-32600` |
| respuesta suelta `{"id":7}` | se ignora |
| lote `[ping, notification]` | `[{"id":9,"result":{}}]` |
| `tools/call` sin clave | `isError: true` con los pasos para sacar el token |

- stdout: las 9 líneas son JSON-RPC válido y stderr quedó vacío. Con clave, stderr solo trae `Apify MCP server ready (5/5 tools mapped)`.
- Cliente MCP real: `@modelcontextprotocol/inspector@0.17.2 --cli` contra el contenedor. `tools/list` → 5. `tools/call fmcsa_carrier_data` sin clave → el mensaje de error esperado.
- Cierre: con EOF sale con exit 0. `docker stop` (SIGTERM) termina al instante, con exit 0.
- `npm test`: `ok: 5 tools listed without a key; tools/call without a key returns isError`.

## 2. Descripciones y esquemas: OK

Precios comparados contra `GET /v2/acts/cleanyield~<actor>` → `pricingInfos` en vivo. El precio vigente es el que arranca el 05/11, y coincide en las 5:

| Herramienta | Hoy (Free → planes altos) | Futuro |
|---|---|---|
| ATS Jobs | 0,002 → 0,0012 por empleo, más 0,005 por corrida | "From 2026-11-24" 0,005 → 0,003: correcto, marcado como futuro |
| Company Enrichment | 0,01 → 0,007 | "From 2026-11-24" 0,01 → 0,0075: correcto |
| App Reviews | 0,0001 → 0,00008 | — |
| FMCSA | 0,005 → 0,0035 | — |
| Licitaciones | 0,008 → 0,0062 | — |

- ATS Jobs dice "Greenhouse, Lever, Ashby, Workday, iCIMS and 14 more ATS" (19 en total) y sueldo "when posted". No da porcentajes y no promete de más.
- `inputSchema`: lo comparé campo por campo contra el input schema del build `default` publicado (ATS 1.1.48, CE 1.1.31, Reviews 1.1.22, FMCSA 0.2.38, Licitaciones 1.1.38). Coinciden propiedades, `required`, tipos, defaults y enums, sin ninguna diferencia. Compilan en Ajv 8 en modo estricto y los `examples` validan contra su esquema.

## 3. Llamadas sin clave y con clave: OK

- Sin clave: error claro al instante, sin colgarse (probado con 2 herramientas).
- Con clave (`APIFY_TOKEN=dummy`; el proxy pone la clave real), en Docker: `app_store_google_play_reviews` con 3 reseñas de Duolingo en el App Store.
  - Resultado `isError: false`, en 12 s.
  - Corrida `aDJzlUyUZhumGeyOu`: SUCCEEDED, dataset con 3 ítems, filas incluidas en la respuesta.
  - Cobro según la API de la corrida: `apify-default-dataset-item: 3`, es decir cobro = ítems. Costo USD 0,00026.
- Procesos: con node local por `npx` (1 reseña), durante la llamada aparecen el hijo `npm exec` y el `actors-mcp-server`.
  - Con EOF no queda ningún proceso colgado.
  - Con SIGTERM al padre mientras el hijo vive, tampoco queda ningún proceso.
  - stdout del padre: solo 2 líneas JSON-RPC (id 1 y 3). El ruido del hijo no se mezcla.

## 4. Paquete: OK

- `package.json` 1.0.1, `server.json` 1.0.1 y `packages[0].version` 1.0.1: las tres iguales.
- `server.json` es válido contra su `$schema` (2025-12-11, draft-07, Ajv).
- `npm pack --dry-run`: 5 archivos (`index.js`, `tools.json`, `README.md`, `LICENSE`, `package.json`). `tools.json` va incluido.
- El Dockerfile copia `tools.json` y fija `@apify/actors-mcp-server@0.20.2`, igual que `index.js`.
- README coherente: lista sin clave, explica `CLEAN_YIELD_MAX_ITEMS` y Docker.

## 5. Seguridad: OK

- El token no se loguea: los únicos `log()` son "ready" y stack de errores, y ninguno lo incluye.
- El token no se escribe en archivos: solo pasa por el entorno al proceso hijo.
- No aparece en stdout ni en stderr de las corridas: `grep dummy` → 0.
- No hay tokens en el repo (`apify_api_…` → ninguno).

## Observaciones menores (no bloquean)

1. **SIGTERM** hace `process.exit(0)` al instante. Si llega justo mientras se escribe un `tools/list` grande, podría cortarlo. Es el mismo caso que se arregló para EOF, pero con SIGTERM es muy poco probable. Sugerencia: cerrar el hijo y dejar que node salga solo.
2. **Cambios futuros de los extras**: la descripción solo marca "From" el precio principal.
   - Hoy no se avisan: App Reviews `app-monitored` (0,005 → 0,01 el 24/11) ni los eventos nuevos `company-watched` y `carrier-watched`.
   - No es un error sobre lo que se cobra hoy. Correr `npm run build:tools` el 24/11.
3. `readOnlyHint: true` en herramientas que cobran. Es correcto según la especificación (no modifican nada), pero el costo solo figura en la descripción.
4. El README dice "Uruguay in beta" y la descripción de Licitaciones lista Uruguay sin aclararlo, porque toma el título de la Store. En npm sigue publicada la 1.0.0, así que `npx clean-yield-mcp` del ejemplo usa la versión vieja hasta que se publique la 1.0.1.
