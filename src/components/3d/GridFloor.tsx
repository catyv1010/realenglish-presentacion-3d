import { Grid } from '@react-three/drei'

export function GridFloor() {
  return (
    <Grid
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      args={[100, 100]}
      cellSize={1}
      cellThickness={0.6}
      cellColor="#22d3ee"
      sectionSize={5}
      sectionThickness={1.2}
      sectionColor="#60a5fa"
      fadeDistance={70}
      fadeStrength={1.2}
      infiniteGrid
    />
  )
}
