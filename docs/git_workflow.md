# Flujo de trabajo Git — main / develop / feature branches

Pensado para el equipo de 6 (CEO/marketing, 2 backend, 2 frontend, 1 fullstack) trabajando en paralelo sobre los módulos del MVP. Es una versión simplificada de Gitflow — sin `release/*` ni `hotfix/*` complejos, porque en etapa hackatón/MVP eso es sobre-ingeniería. Lo importante es que `main` nunca se rompa y que cada quien trabaje aislado en su rama sin pisarse.

---

## 1. Estructura de ramas

```
main            → siempre desplegable/demo-ready. Solo recibe merges desde develop.
  └── develop   → rama de integración. Aquí se juntan todas las features antes de pasar a main.
        ├── feature/auth-telefono
        ├── feature/publicar-tarifa
        ├── feature/explorar-comprador
        ├── feature/panel-admin
        ├── feature/pwa-offline
        └── fix/nombre-del-bug
```

**Regla de oro:** nadie hace commits directo a `main` ni a `develop`. Todo entra por Pull Request (PR), aunque sea el mismo equipo revisándose entre sí en 5 minutos. Esto evita que un push accidental rompa la demo del jurado el día del pitch.

---

## 2. Setup inicial (lo hace 1 persona, una sola vez)

```bash
# Ya con el repo creado en GitHub con la rama main por defecto
git checkout -b develop
git push -u origin develop
```

En GitHub → Settings → Branches, configurar protección básica (si el plan de GitHub del equipo lo permite):
- `main`: requiere Pull Request antes de mergear, no permite push directo.
- `develop`: requiere Pull Request antes de mergear.

Si están en un repo gratuito sin protección de ramas disponible, la regla se vuelve **de disciplina de equipo**, no técnica: acuerden entre los 6 que nadie pushea directo a esas dos ramas, punto.

---

## 3. Convención de nombres de rama

Mapeando directo a los módulos que ya definimos en los prompts de desarrollo, para que quede trazable qué rama corresponde a qué parte del MVP:

| Rama | Corresponde a |
|---|---|
| `feature/setup-stack` | Prompt 0 — setup del proyecto |
| `feature/esquema-db` | Prompt 1 — esquema de base de datos |
| `feature/auth-telefono` | Prompt 2 — autenticación |
| `feature/publicar-tarifa` | Prompt 3 — publicar producto + lógica de tarifa |
| `feature/explorar-comprador` | Prompt 4 — explorar y contactar |
| `feature/panel-admin` | Prompt 5 — panel de administración |
| `feature/cuota-mensual` | Prompt 6 — reseteo de cuota gratis |
| `feature/pwa-offline` | Prompt 7 — instalabilidad y offline |
| `fix/<descripcion-corta>` | Corrección de bugs sobre algo ya mergeado a develop |
| `chore/<descripcion-corta>` | Tareas que no son feature ni bug (configurar linter, actualizar README, etc.) |

Formato general: `tipo/descripcion-corta-en-kebab-case`, todo en minúsculas, sin espacios ni tildes.

---

## 4. Flujo de trabajo diario (lo que hace cada dev)

```bash
# 1. Siempre arrancar una rama nueva desde develop actualizado
git checkout develop
git pull origin develop
git checkout -b feature/publicar-tarifa

# 2. Trabajar y commitear seguido, con mensajes claros
git add .
git commit -m "feat: calcular tramo de tarifa segun valor declarado"

# 3. Si develop avanzó mientras trabajabas (otros mergearon), traer los cambios
git checkout develop
git pull origin develop
git checkout feature/publicar-tarifa
git merge develop
# resolver conflictos si aparecen, luego:
git add .
git commit -m "merge: traer cambios de develop"

# 4. Subir la rama y abrir el Pull Request
git push -u origin feature/publicar-tarifa
# → abrir PR en GitHub: base = develop, compare = feature/publicar-tarifa
```

### Convención de mensajes de commit (Conventional Commits, simplificado)

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección de un bug |
| `chore:` | Configuración, dependencias, tareas sin lógica de negocio |
| `refactor:` | Reordenar código sin cambiar comportamiento |
| `docs:` | Cambios solo en documentación |

No es obligatorio ser estricto con esto en un hackatón, pero ayuda muchísimo cuando 5 personas mergean seguido y alguien necesita entender rápido el historial.

---

## 5. Pull Request: qué debe tener

Cada PR hacia `develop` debería incluir, como mínimo:

1. **Título claro**: qué hace, no "cambios varios". Ej: "Implementa cálculo de tarifa por tramos en publicación".
2. **Descripción corta**: qué prompt/módulo de los definidos cubre, y qué se probó manualmente.
3. **Al menos 1 revisor** de otra persona del equipo antes de mergear (aunque sea revisión de 5 minutos) — con 6 personas alcanza para que nadie mergee sin que nadie más haya visto el código.
4. **Squash and merge** al aprobar (GitHub tiene esta opción al mergear) — así el historial de `develop` queda limpio, un commit por feature, en vez de 15 commits intermedios de "fix typo", "prueba", etc.

Cuando `develop` esté estable y probado en conjunto (ej. antes de una demo o del cierre del hackatón), se abre un PR de `develop` → `main`.

---

## 6. Prompts para usar con GitHub Copilot Chat

Estos los pueden pegar directo en el chat de Copilot dentro de VS Code para que les ayude en cada paso del flujo.

**Para generar un buen mensaje de commit a partir de los cambios que hicieron:**
```
Mira los cambios que tengo en staging (git diff --staged) y sugiéreme un mensaje de commit siguiendo Conventional Commits (feat/fix/chore/refactor/docs), en español, describiendo qué hace el cambio, no cómo lo hice.
```

**Para generar la descripción de un Pull Request:**
```
Genera la descripción de un Pull Request en español para esta rama, basándote en los commits que tiene sobre develop. Incluye: qué funcionalidad agrega, qué archivos toca, y una checklist de qué debería probar el revisor manualmente antes de aprobar.
```

**Para resolver un conflicto de merge:**
```
Tengo un conflicto de merge en este archivo al traer develop a mi rama feature/publicar-tarifa. Explícame qué representa cada bloque en conflicto (<<<<<<< HEAD vs. >>>>>>> develop) en términos simples, y sugiéreme cómo resolverlo sin perder la lógica de ninguno de los dos lados, antes de que yo decida.
```

**Para revisar código antes de abrir el PR (auto-revisión):**
```
Actúa como revisor de código estricto. Revisa los cambios de esta rama respecto a develop y dime: 1) si hay algo que rompería el esquema de RLS de Supabase que ya definimos, 2) si hay manejo de errores faltante visible al usuario, 3) si hay código duplicado que debería reutilizarse de otro módulo ya mergeado. Sé específico con el archivo y línea.
```

**Para entender rápido una rama de un compañero antes de revisar su PR:**
```
Resume en 5 líneas qué hace esta rama comparada con develop, en términos de negocio (no solo técnicos), para que pueda revisar el PR entendiendo el impacto en el flujo del vendedor/comprador.
```

---

## 7. Qué NO hacer (errores comunes en equipos de hackatón)

- **No trabajen todos directo sobre `develop`** "para ir más rápido" — es justo lo que genera los conflictos gigantes la noche antes de la entrega.
- **No dejen ramas feature abiertas más de 2-3 días** sin mergear — mientras más tiempo pasa, más diverge de develop y peor el conflicto al final. Si un módulo es grande (como el Prompt 3, publicar + tarifa), divídanlo en sub-tareas más chicas con PRs más frecuentes.
- **No mergeen a `main` sin haber probado la demo completa** en develop primero (flujo: registrarse → publicar → ver tarifa aplicada → explorar → contactar por WhatsApp). `main` debe ser siempre lo que le van a mostrar al jurado.
