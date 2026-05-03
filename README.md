# 📊 Sistema de Diagnóstico Sectorial

Plataforma web de análisis financiero sectorial para Colombia 2020–2024, conectada a Supabase con 141,991 registros empresariales.

## 🚀 Funcionalidades

- **🏥 Índice de Salud Sectorial** — Score 0–100 con gauge, radar y tabla de ratios por año
- **🔬 Análisis DuPont** — Descomposición ROE = Margen Neto × Rotación Activos × Multiplicador
- **🔭 Índice de Prospectiva Sectorial** — CAGR de ingresos, activos y ganancia + tendencia de márgenes
- **⭐ Índice de Atractivo Sectorial** — Comparación vs top 30 sectores por ingresos

## 🔍 Búsqueda de CIIU

- Escribe el **número** (ej: `4759`) o la **descripción** del sector
- Navegación con teclado: ↑↓ flechas + Enter + Escape
- 488 códigos CIIU disponibles

## 🗄️ Base de Datos

| Campo | Valor |
|-------|-------|
| Plataforma | Supabase (PostgreSQL) |
| Tabla | `public.base_datos` |
| Registros | 141,991 empresas |
| Período | 2020 – 2024 |
| País | Colombia |

## ▶️ Uso Local

```bash
# Instalar servidor estático
npx serve . -l 3000

# Abrir en el navegador
http://localhost:3000
```

## 🗂️ Estructura

```
├── index.html          # Página principal (estructura HTML)
├── styles.css          # Diseño dark theme + glassmorphism
├── main.js             # Lógica, gráficos y conexión a Supabase
├── CREATE_TABLE.sql    # SQL para crear la tabla en Supabase
└── CREATE_FUNCTIONS.sql # Funciones RPC para análisis
```

## ⚙️ Configuración Supabase

Antes de usar, ejecuta en el **SQL Editor de Supabase**:
1. `CREATE_TABLE.sql` — crea la tabla `base_datos`
2. `CREATE_FUNCTIONS.sql` — crea las funciones RPC de análisis

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Base de datos:** Supabase (PostgreSQL)
- **Gráficos:** Chart.js 4.4
- **Fuentes:** Google Fonts (Inter)
