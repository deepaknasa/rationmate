function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeRationItem(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }

  const id = firstDefined(record.id, record.Id);
  const name = firstDefined(record.name, record.Name, record.item_name, record.ItemName);
  const quantity = firstDefined(record.quantity, record.Quantity);
  const unit = firstDefined(record.unit, record.Unit);
  const score = firstDefined(
    record.score,
    record.Score,
    record.weightage,
    record.Weightage,
    record.consumptionRate,
    record.ConsumptionRate,
  );
  const fillDate = firstDefined(record.fillDate, record.FillDate);

  return {
    ...record,
    ...(id !== undefined ? { id } : {}),
    ...(name !== undefined ? { name, item_name: name } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(score !== undefined ? { score, weightage: score } : {}),
    ...(fillDate !== undefined ? { fillDate } : {}),
  };
}

function normalizeRationItemsResponse(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeRationItem);
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload.items)) {
    return {
      ...payload,
      items: payload.items.map(normalizeRationItem),
    };
  }

  if (Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.map(normalizeRationItem),
    };
  }

  if (Array.isArray(payload.records)) {
    return {
      ...payload,
      records: payload.records.map(normalizeRationItem),
    };
  }

  return normalizeRationItem(payload);
}

function mapRationItemWritePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const id = firstDefined(payload.Id, payload.id);
  const name = firstDefined(payload.Name, payload.item_name, payload.name);
  const quantity = firstDefined(payload.Quantity, payload.quantity);
  const unit = firstDefined(payload.Unit, payload.unit);
  const score = firstDefined(
    payload.ConsumptionRate,
    payload.consumptionRate,
    payload.score,
    payload.Score,
    payload.weightage,
    payload.Weightage,
  );
  const fillDate = firstDefined(payload.FillDate, payload.fillDate);

  return {
    ...(id !== undefined ? { Id: id } : {}),
    ...(name !== undefined ? { Name: name } : {}),
    ...(quantity !== undefined ? { Quantity: quantity } : {}),
    ...(unit !== undefined ? { Unit: unit } : {}),
    ...(score !== undefined ? { ConsumptionRate: score } : {}),
    ...(fillDate !== undefined ? { FillDate: fillDate } : {}),
  };
}

function mapRationItemsWritePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.items)) {
    return {
      ...payload,
      items: payload.items.map(mapRationItemWritePayload),
    };
  }

  return mapRationItemWritePayload(payload);
}

export {
  mapRationItemWritePayload,
  mapRationItemsWritePayload,
  normalizeRationItem,
  normalizeRationItemsResponse,
};
