import * as THREE from 'three'

function getPoints(resolution: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let x = (i + 0.5) / resolution; 
            let y = (j + 0.5) / resolution; 
            points.push(new THREE.Vector3(x, y, 0));
        }
    }

    return points;
}

function getArrays(points: THREE.Vector3[]): 
        {positions: number[], directions: number[], indices: number[]} {
    const positions: number[] = [];
    const directions: number[] = [];
    const indices: number[] = [];

    points.forEach((p, i) => {

        // 4 vertices per quad (duplicating A and B)
        positions.push(...p.toArray()); // 0
        positions.push(...p.toArray()); // 1
        positions.push(...p.toArray()); // 2
        positions.push(...p.toArray()); // 3

        directions.push(-1, -1);
        directions.push(1, -1);
        directions.push(1, 1);
        directions.push(-1, 1);

        const base = i * 4;
        indices.push(base + 0, base + 1, base + 2);
        indices.push(base + 0, base + 2, base + 3);
    });

    return { positions, directions, indices };
}

function ProjectionGeometry(resolution: number) {
    const points = getPoints(resolution);
    const { positions, directions, indices } = getArrays(points);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 2)); 
    geometry.setIndex(indices);

    return geometry;
}

export default ProjectionGeometry;