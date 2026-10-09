function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function edgeIsActiveAt(edge, businessAsOf) {
  return edge.status === 'active'
    && (!edge.validFrom || edge.validFrom <= businessAsOf)
    && (!edge.validTo || businessAsOf < edge.validTo);
}

export function findEvidencePaths({ nodes, edges, startId, targetType, targetId, businessAsOf, maxDepth = 4, maxPaths = 100 }) {
  if (!isDate(businessAsOf)) throw new TypeError('businessAsOf must be a valid YYYY-MM-DD date.');
  if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 4) throw new RangeError('maxDepth must be between 1 and 4.');
  if (!Number.isInteger(maxPaths) || maxPaths < 1 || maxPaths > 100) throw new RangeError('maxPaths must be between 1 and 100.');

  const nodeById = new Map();
  for (const node of nodes) {
    if (!node.id || !node.type || nodeById.has(node.id)) throw new Error('Graph nodes require unique IDs and types.');
    nodeById.set(node.id, node);
  }
  if (!nodeById.has(startId)) throw new Error('Graph start node does not exist.');

  const adjacency = new Map([...nodeById.keys()].map((id) => [id, []]));
  for (const edge of edges) {
    if (!edge.id || !nodeById.has(edge.sourceNodeId) || !nodeById.has(edge.targetNodeId)) {
      throw new Error('Graph edge references a missing node or ID.');
    }
    if (edge.relationKind === 'derived' && !edge.reason) throw new Error('Derived graph edges require an explanation.');
    if (!Array.isArray(edge.sourceRecordIds) || edge.sourceRecordIds.length === 0) {
      throw new Error('Graph edges require at least one source record.');
    }
    if (!edgeIsActiveAt(edge, businessAsOf)) continue;
    adjacency.get(edge.sourceNodeId).push({ edge, nextId: edge.targetNodeId, direction: 'forward' });
    adjacency.get(edge.targetNodeId).push({ edge, nextId: edge.sourceNodeId, direction: 'reverse' });
  }

  const paths = [];
  const visited = new Set([startId]);
  const nodePath = [nodeById.get(startId)];
  const edgePath = [];

  function visit(currentId) {
    if (paths.length >= maxPaths) return;
    const current = nodeById.get(currentId);
    if (current.type === targetType && (!targetId || current.id === targetId)) {
      paths.push({ nodes: [...nodePath], edges: [...edgePath] });
      return;
    }
    if (edgePath.length >= maxDepth) return;

    for (const link of adjacency.get(currentId)) {
      if (visited.has(link.nextId)) continue;
      visited.add(link.nextId);
      nodePath.push(nodeById.get(link.nextId));
      edgePath.push({ ...link.edge, direction: link.direction });
      visit(link.nextId);
      edgePath.pop();
      nodePath.pop();
      visited.delete(link.nextId);
      if (paths.length >= maxPaths) return;
    }
  }

  visit(startId);
  return paths;
}

export function hasSourceGroupCoverage(path, sourceGroups, minimum = 3) {
  if (!Number.isInteger(minimum) || minimum < 1) throw new RangeError('minimum must be a positive integer.');
  const groups = new Set();
  for (const edge of path.edges) {
    for (const sourceId of edge.sourceRecordIds) {
      const group = sourceGroups instanceof Map ? sourceGroups.get(sourceId) : sourceGroups[sourceId];
      if (group) groups.add(group);
    }
  }
  return groups.size >= minimum;
}
