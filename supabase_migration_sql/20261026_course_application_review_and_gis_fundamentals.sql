-- Add course catalog details, application review notes, and a draft GIS Fundamentals course.
-- Run this script once in the Supabase SQL Editor. Do not run it until the backend deployment
-- containing the matching model and API changes is ready.
BEGIN;

ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS start_date date,
    ADD COLUMN IF NOT EXISTS end_date date,
    ADD COLUMN IF NOT EXISTS requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS learning_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS topics jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS course_outline jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.enrollments
    ADD COLUMN IF NOT EXISTS review_message text;

INSERT INTO public.courses (
    id,
    title,
    slug,
    description,
    price,
    mode,
    category,
    level,
    duration_weeks,
    start_date,
    end_date,
    requirements,
    learning_outcomes,
    topics,
    course_outline,
    is_published,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'GIS Fundamentals',
    'gis-fundamentals',
    'This course introduces learners to the fundamental concepts, tools, and techniques of Geographic Information Systems (GIS). Using ArcGIS Pro, learners will explore how to collect, manage, analyse, and visualise spatial data to solve real-world geographical problems. The course covers vector and raster data, coordinate reference systems, map creation, geospatial analysis, and the presentation of GIS results. Through practical, hands-on exercises, learners will develop the essential skills needed to work confidently with GIS data and apply spatial analysis techniques to environmental management, urban planning, surveying, and other geospatial applications.',
    0,
    'online',
    'Geographic Information Systems',
    'beginner',
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    '[
      "Explain the fundamental concepts, principles, and applications of Geographic Information Systems (GIS).",
      "Identify the key components of GIS and their roles in spatial data management and analysis.",
      "Differentiate between vector and raster data models and understand their applications.",
      "Understand coordinate reference systems, map projections, and geographic coordinate systems.",
      "Import, organise, manage, and edit spatial data in ArcGIS Pro.",
      "Create, customise, and interpret professional maps using GIS cartographic techniques.",
      "Perform basic geoprocessing operations, including buffering, clipping, intersecting, and dissolving features.",
      "Work with attribute tables, field calculations, queries, and data selection tools.",
      "Acquire and integrate spatial data from GPS, remote sensing, and other geospatial sources.",
      "Perform introductory spatial analysis to solve real-world geographical problems.",
      "Work with raster datasets and understand basic terrain and elevation analysis.",
      "Export, present, and share GIS maps, analytical results, and project outputs.",
      "Apply GIS techniques to practical challenges in environmental management, urban planning, transportation, and land administration.",
      "Develop a foundational GIS project from data preparation to map production and presentation."
    ]'::jsonb,
    '[
      "GIS fundamentals and spatial thinking",
      "ArcGIS Pro interface and project management",
      "Vector and raster data management",
      "Coordinate systems and map projections",
      "Spatial data acquisition and editing",
      "Attribute tables and data queries",
      "Geoprocessing and spatial analysis",
      "Basic terrain and elevation analysis",
      "Cartography and professional map design",
      "GIS data visualisation and reporting",
      "Geospatial problem-solving",
      "GIS project preparation and presentation"
    ]'::jsonb,
    '[
      {
        "title": "Module 1: Introduction to GIS and Geospatial Concepts",
        "topics": [
          "Definition, history, and evolution of GIS",
          "Components and applications of GIS",
          "Spatial data, geographic features, and attributes",
          "Introduction to vector and raster data",
          "GIS applications in environmental management, surveying, and urban planning"
        ]
      },
      {
        "title": "Module 2: Getting Started with ArcGIS Pro and Spatial Data Management",
        "topics": [
          "Introduction to the ArcGIS Pro interface",
          "Creating and managing GIS projects",
          "Adding and organising spatial datasets",
          "Working with shapefiles, feature classes, and geodatabases",
          "Understanding coordinate reference systems and map projections",
          "Importing, editing, and managing spatial data"
        ]
      },
      {
        "title": "Module 3: Map Making, Attribute Data, and Geoprocessing",
        "topics": [
          "Working with attribute tables and field calculations",
          "Selecting and querying spatial features",
          "Applying symbology, labels, and map layouts",
          "Creating professional maps with titles, legends, scale bars, and north arrows",
          "Performing buffer, clip, intersect, merge, and dissolve operations",
          "Exporting maps and presenting GIS results"
        ]
      },
      {
        "title": "Module 4: Introduction to Spatial Analysis and Practical GIS Projects",
        "topics": [
          "Introduction to spatial analysis concepts",
          "Basic vector and raster analysis",
          "Introduction to DEMs and terrain data",
          "Understanding proximity, overlay, and suitability analysis",
          "Applying GIS to real-world case studies",
          "Developing a practical GIS project",
          "Preparing a final map, project report, and presentation"
        ]
      }
    ]'::jsonb,
    false,
    now(),
    now()
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
