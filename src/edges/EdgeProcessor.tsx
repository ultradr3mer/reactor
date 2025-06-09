import * as THREE from 'three'

function getSegments(edges: THREE.BufferGeometry): { a: THREE.Vector3; b: THREE.Vector3 }[] {
    const posAttr = edges.getAttribute('position');
    const edgeSegments: { a: THREE.Vector3; b: THREE.Vector3 }[] = [];

    for (let i = 0; i < posAttr.count; i += 2) {
        const a = new THREE.Vector3().fromArray(posAttr.array, i * 3);
        const b = new THREE.Vector3().fromArray(posAttr.array, (i + 1) * 3);
        edgeSegments.push({ a, b });
    }

    return edgeSegments;
}

function getArrays(segments: { a: THREE.Vector3; b: THREE.Vector3 }[]): 
        {positions: number[], others: number[], directions: number[], indices: number[]} {
    const positions: number[] = [];
    const others: number[] = [];
    const directions: number[] = [];
    const indices: number[] = [];

    segments.forEach((edge, i) => {
        const { a, b } = edge;

        // 4 vertices per quad (duplicating A and B)
        positions.push(...a.toArray()); // 0
        positions.push(...a.toArray()); // 1
        positions.push(...b.toArray()); // 2
        positions.push(...b.toArray()); // 3

        // Normal direction for screen-space expansion
        others.push(...b.toArray()); 
        others.push(...b.toArray()); 
        others.push(...a.toArray()); 
        others.push(...a.toArray()); 

        directions.push(-1);
        directions.push(1);
        directions.push(-1);
        directions.push(1);

        const base = i * 4;
        indices.push(base + 0, base + 1, base + 2);
        indices.push(base + 0, base + 2, base + 3);
    });

    return { positions, others, directions, indices };
}

function ProcessEdge(edges: THREE.BufferGeometry) {
    const segments = getSegments(edges);
    const { positions, others, directions, indices } = getArrays(segments);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('other', new THREE.Float32BufferAttribute(others, 3));
    geometry.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 1)); 
    geometry.setIndex(indices);

    return geometry;
}

export default ProcessEdge;