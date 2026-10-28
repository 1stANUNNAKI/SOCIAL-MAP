# 📐 المعمارية الهندسية لنموذج مدينة CityRT (`ARCHITECTURE.md`)

يوثق هذا الملف البنية البرمجية لنموذج المدينة الثلاثي الأبعاد المبني بمحرك **Three.js (WebGL2)** استناداً إلى نتائج الهندسة العكسية للعبة **CityRT (`skylines-sketch`)**.

## المكونات السبعة للنموذج:
1. **التضاريس والأنهار والجسور (`src/terrain/sdfTerrain.js`)**
2. **أطلس اللافتات متعدد اللغات (`src/rendering/signAtlas.js`)**
3. **الأحياء المعمارية الأربعة والمعالم (`src/buildings/proceduralBuildings.js`)**
4. **الغطاء النباتي المجمّع (`src/nature/foliageAndWater.js`)**
5. **محاكاة السيارات والقوارب والمشاة (`src/simulation/trafficAndCitizens.js`)**
6. **محرك الجو (24 ساعة) وتظليل القلم (`src/rendering/sketchAtmosphere.js`)**
7. **أنظمة تنقل المستخدم الثلاثة (`src/controls/navigationController.js`)**

