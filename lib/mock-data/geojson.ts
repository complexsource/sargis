import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon } from "geojson";
import { plotRecords } from "./plots";
import { tpsRecords } from "./tps";

type Coordinates = [number, number];

const box = ([lng, lat]: Coordinates, width = 0.0024, height = 0.0016): Coordinates[] => [
  [lng - width / 2, lat - height / 2],
  [lng + width / 2, lat - height / 2],
  [lng + width / 2, lat + height / 2],
  [lng - width / 2, lat + height / 2],
  [lng - width / 2, lat - height / 2]
];

const line = (points: Coordinates[], properties: Record<string, unknown> = {}): Feature<LineString> => ({
  type: "Feature",
  geometry: { type: "LineString", coordinates: points },
  properties
});

const polygon = (points: Coordinates[], properties: Record<string, unknown> = {}): Feature<Polygon> => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [points] },
  properties
});

const point = (coordinates: Coordinates, properties: Record<string, unknown> = {}): Feature<Point> => ({
  type: "Feature",
  geometry: { type: "Point", coordinates },
  properties
});

const collection = <T extends Geometry>(features: Feature<T>[]): FeatureCollection<T> => ({
  type: "FeatureCollection",
  features
});

const finalPlotBoundaries = collection(
  plotRecords.map((plot, index) =>
    line(box(plot.coordinates, 0.0018 + index * 0.00012, 0.00125), {
      id: plot.id,
      plotId: plot.plotId,
      finalPlotNumber: plot.finalPlotNumber,
      layer: "Final Plot Boundary"
    })
  )
);

const originalPlotBoundaries = collection(
  plotRecords.map((plot, index) =>
    line(box([plot.coordinates[0] - 0.0002, plot.coordinates[1] + 0.00015], 0.0021 + index * 0.0001, 0.00145), {
      id: plot.id,
      plotId: plot.plotId,
      originalPlotNumber: plot.originalPlotNumber,
      layer: "Original Plot Boundary"
    })
  )
);

const tpsBoundary = collection(
  tpsRecords.map((tps) =>
    line(box(tps.centroid, 0.011, 0.008), {
      id: tps.id,
      name: tps.name,
      number: tps.number,
      layer: "TPS Boundary"
    })
  )
);

const villageBoundary = collection(
  tpsRecords.map((tps) =>
    line(box([tps.centroid[0] + 0.0008, tps.centroid[1] - 0.0002], 0.014, 0.01), {
      village: tps.village,
      layer: "Village Boundary"
    })
  )
);

const surveyLines = collection(
  plotRecords.flatMap((plot) => [
    line(
      [
        [plot.coordinates[0] - 0.0024, plot.coordinates[1] - 0.0012],
        [plot.coordinates[0] + 0.0024, plot.coordinates[1] + 0.0012]
      ],
      { surveyNumber: plot.surveyNumber, layer: "Survey Line" }
    ),
    line(
      [
        [plot.coordinates[0] - 0.0022, plot.coordinates[1] + 0.001],
        [plot.coordinates[0] + 0.0022, plot.coordinates[1] - 0.001]
      ],
      { surveyNumber: plot.surveyNumber, layer: "Survey Line" }
    )
  ])
);

const hissaLines = collection(
  plotRecords.map((plot) =>
    line(
      [
        [plot.coordinates[0] - 0.0009, plot.coordinates[1]],
        [plot.coordinates[0] + 0.0009, plot.coordinates[1]]
      ],
      { surveyNumber: plot.surveyNumber, layer: "Hissa Line" }
    )
  )
);

const waterBodies = collection([
  polygon(box([72.7973, 21.1438], 0.0042, 0.0014), { name: "Canal influence", layer: "Water Body" }),
  polygon(box([72.501, 23.0718], 0.0028, 0.0012), { name: "Storm water pond", layer: "Water Body" })
]);

const gamthalBoundary = collection([
  line(box([70.7868, 22.2632], 0.0038, 0.0022), { name: "Mavdi Gamtal edge", layer: "Gamthal Boundary" })
]);

const dpReservation = collection([
  polygon(box([72.4997, 23.0738], 0.0023, 0.0011), { reservationType: "Neighbourhood open space", layer: "DP Reservation" }),
  polygon(box([73.1452, 22.323], 0.002, 0.001), { reservationType: "DP road widening", layer: "DP Reservation" })
]);

const roadNetwork = collection(
  plotRecords.map((plot) =>
    line(
      [
        [plot.coordinates[0] - 0.0032, plot.coordinates[1] - 0.0015],
        [plot.coordinates[0] + 0.0032, plot.coordinates[1] - 0.0015]
      ],
      { roadName: plot.roadName, widthM: plot.nearbyRoadWidthM, layer: "Road" }
    )
  )
);

const roadBoundary = collection(
  plotRecords.flatMap((plot) => [
    line(
      [
        [plot.coordinates[0] - 0.0032, plot.coordinates[1] - 0.00135],
        [plot.coordinates[0] + 0.0032, plot.coordinates[1] - 0.00135]
      ],
      { roadName: plot.roadName, layer: "Road Boundary" }
    ),
    line(
      [
        [plot.coordinates[0] - 0.0032, plot.coordinates[1] - 0.00165],
        [plot.coordinates[0] + 0.0032, plot.coordinates[1] - 0.00165]
      ],
      { roadName: plot.roadName, layer: "Road Boundary" }
    )
  ])
);

const htLine = collection([
  line(
    [
      [73.1434, 22.3245],
      [73.1467, 22.3216]
    ],
    { name: "HT corridor", layer: "HT Line" }
  )
]);

const railwayLine = collection([
  line(
    [
      [70.7847, 22.2645],
      [70.7904, 22.2608]
    ],
    { name: "Rail alignment", layer: "Railway Line" }
  )
]);

const railwayBoundary = collection([
  line(
    [
      [70.7845, 22.264],
      [70.7902, 22.2603]
    ],
    { name: "Rail boundary", layer: "Railway Boundary" }
  ),
  line(
    [
      [70.785, 22.265],
      [70.7907, 22.2613]
    ],
    { name: "Rail boundary", layer: "Railway Boundary" }
  )
]);

const compoundWall = collection([
  line(
    [
      [73.1446, 22.3239],
      [73.1462, 22.3235],
      [73.146, 22.3224]
    ],
    { layer: "Compound Wall" }
  )
]);

const buildingStructureLine = collection(
  plotRecords.slice(0, 3).map((plot) =>
    line(box([plot.coordinates[0] + 0.00015, plot.coordinates[1] + 0.00005], 0.0008, 0.00045), {
      plotId: plot.plotId,
      layer: "Building Structure Line"
    })
  )
);

const plotLabels = collection(
  plotRecords.map((plot) =>
    point(plot.coordinates, {
      label: plot.finalPlotNumber,
      plotId: plot.plotId,
      layer: "Plot Labels"
    })
  )
);

const surveyNumberLabels = collection(
  plotRecords.map((plot) =>
    point([plot.coordinates[0] + 0.0005, plot.coordinates[1] + 0.00045], {
      label: plot.surveyNumber,
      layer: "Survey Number Labels"
    })
  )
);

export const layerGeoJson: Record<string, FeatureCollection> = {
  "final-plot-boundary": finalPlotBoundaries,
  "original-plot-boundary": originalPlotBoundaries,
  "tps-boundary": tpsBoundary,
  "village-boundary": villageBoundary,
  "survey-line": surveyLines,
  "hissa-line": hissaLines,
  "water-body": waterBodies,
  "gamthal-boundary": gamthalBoundary,
  "dp-reservation": dpReservation,
  "road-network": roadNetwork,
  "road-boundary": roadBoundary,
  "ht-line": htLine,
  "railway-line": railwayLine,
  "railway-boundary": railwayBoundary,
  "compound-wall": compoundWall,
  "building-structure-line": buildingStructureLine,
  "plot-labels": plotLabels,
  "survey-number-labels": surveyNumberLabels
};

export function getLayerGeoJson(layerName: string): FeatureCollection {
  return layerGeoJson[layerName] ?? collection([]);
}
