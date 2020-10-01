from decimal import Decimal
from flask import request
from flask_restplus import Resource, fields, Namespace

from server import db
from authorization import AuthError, requires_auth, requires_scope
from database import Layer, LayerValue

from api.utils import success_output


class ValidationError(Exception):
    def __init__(self, error, status_code=400):
        super(ValidationError, self).__init__(error)
        self.error = error
        self.status_code = status_code


api = Namespace('layers', description='Operations on layers.', path='/')


# TODO: Add a recalculate derived-layer endpoint.


layer_input = api.model('LayerInput', {
    'name': fields.String(),
    'run_id': fields.Integer(),
    'row_count': fields.Integer(),
    'column_count': fields.Integer(),
    'layer_data': fields.List(fields.List(fields.Arbitrary())),
    'layer_compound_ids': fields.List(fields.List(fields.Integer())),

    # Derived layer fields.
    'derivation_id': fields.Integer(),
    'formula': fields.String(),
})
layer_output = api.model('LayerOutput', {
    'id': fields.Integer(),
    'name': fields.String(),
    'run_id': fields.Integer(),
    'row_count': fields.Integer(),
    'column_count': fields.Integer(),
    'layer_data': fields.List(fields.List(fields.Arbitrary())),
    'layer_compound_ids': fields.List(fields.List(fields.Integer())),

    # Derived layer fields.
    'derivation_id': fields.Integer(),
    'formula': fields.String(),
})
layers_output = api.model('LayersOutput', {
    'layers': fields.List(fields.Nested(layer_output))
})


def group_samples(samples, layers):
    layers_by_id = {layer.id: layer for layer in layers}
    layers_by_layer_id = {}
    for sample in samples:
        layer = layers_by_id[sample.layer_id]
        layer_id = sample.layer_id

        if sample.row > layer.row_count:
            raise IndexError(f'<sample {sample.layer_id}: ({sample.row}, {sample.column})>.row ({sample.row}) is larger than <layer {layer.id}>.row_count ({layer.row_count})')
        if sample.row < 0:
            raise IndexError(f'<sample {sample.layer_id}: ({sample.row}, {sample.column})>.row ({sample.row}) is less than 0')
        if sample.column > layer.column_count:
            raise IndexError(f'<sample {sample.layer_id}: ({sample.row}, {sample.column})>.column ({sample.column}) is larger than <layer {layer.id}>.column_count ({layer.column_count})')
        if sample.column < 0:
            raise IndexError(f'<sample {sample.layer_id}: ({sample.row}, {sample.column})>.column ({sample.column}) is less than 0')

        if layer_id not in layers_by_layer_id:
            layer_data = [[None] * layer.column_count for _ in range(layer.row_count)]
            layer_compound_ids = [[None] * layer.column_count for _ in range(layer.row_count)]
            if sample.value is not None:
                layer_data[sample.row][sample.column] = str(sample.value)
            layer_compound_ids[sample.row][sample.column] = sample.compound_id

            layers_by_layer_id[layer_id] = {
                'id': layer_id,
                'name': layer.name,
                'run_id': layer.run_id,
                'row_count': layer.row_count,
                'column_count': layer.column_count,
                'layer_data': layer_data,
                'layer_compound_ids': layer_compound_ids
            }

            if layer.derivation_id is not None:
                layers_by_layer_id[sample.compound_id]['derivation_id'] = layer.derivation_id
            if layer.formula is not None:
                layers_by_layer_id[sample.compound_id]['formula'] = layer.formula
        else:
            if sample.value is not None:
                layers_by_layer_id[layer_id]['layer_data'][sample.row][sample.column] = str(sample.value)
            layers_by_layer_id[layer_id]['layer_compound_ids'][sample.row][sample.column] = sample.compound_id
    return layers_by_layer_id


def ungroup_layer(layer_raw, layer_id=None):
    layer = Layer(
        name=layer_raw['name'],
        run_id=layer_raw['run_id'],
        row_count=layer_raw['row_count'],
        column_count=layer_raw['column_count'],
    )
    if layer_id is not None:
        layer.id = layer_id
    if 'derivation_id' in layer_raw and layer_raw['derivation_id'] is not None:
        layer.derivation_id = layer_raw['derivation_id']
    if 'formula' in layer_raw and layer_raw['formula'] is not None:
        layer.formula = layer_raw['formula']

    samples = []
    for row in range(layer_raw['row_count']):
        for column in range(layer_raw['column_count']):
            sample = LayerValue(row=row, column=column, layer=layer)

            if 'layer_data' in layer_raw and layer_raw['layer_data'][row][column] is not None:
                sample.value = Decimal(layer_raw['layer_data'][row][column])
            if 'layer_compound_ids' in layer_raw and layer_raw['layer_compound_ids'][row][column] is not None:
                sample.compound_id = layer_raw['layer_compound_ids'][row][column]

            samples.append(sample)

    return layer, samples


def validate_input_layer(layer_raw):
    # Validate the layer_data.
    if 'layer_data' in layer_raw:
        if len(layer_raw['layer_data']) != layer_raw['row_count']:
            raise ValidationError({
                'code': 'Invalid Layer',
                'description': 'Layer has incorrectly formatted data arrays'
            })
        for row in layer_raw['layer_data']:
            if len(row) != layer_raw['column_count']:
                raise ValidationError({
                    'code': 'Invalid Layer',
                    'description': 'Layer has incorrectly formatted data arrays'
                })
    
    # Validate the layer_compound_ids.
    if 'layer_compound_ids' in layer_raw:
        if len(layer_raw['layer_compound_ids']) != layer_raw['row_count']:
            raise ValidationError({
                'code': 'Invalid Layer',
                'description': 'Layer has incorrectly formatted sample id arrays'
            })
        for row in layer_raw['layer_compound_ids']:
            if len(row) != layer_raw['column_count']:
                raise ValidationError({
                    'code': 'Invalid Layer',
                    'description': 'Layer has incorrectly formatted sample id arrays'
                })


@api.route('/run/<int:run_id>/layer')
class LayersResource(Resource):
    @api.doc(security='token', model=layers_output)
    @requires_auth
    def get(self, run_id):
        if requires_scope('read:layers'):
            layer_values = LayerValue.query\
                .join(Layer, LayerValue.layer_id == Layer.id)\
                .filter(Layer.run_id == run_id)\
                .all()
            layers = Layer.query\
                .filter(Layer.run_id == run_id)\
                .all()

            return sorted(group_samples(layer_values, layers).values(), key=lambda layer: layer['id'])
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:layers"'
        }, 401)

    @api.doc(security='token', model=layer_output, body=layer_input)
    @requires_auth
    def post(self, run_id):
        if requires_scope('write:layers'):
            layer_raw = request.json
            if layer_raw['run_id'] != run_id:
                raise ValidationError({
                    'code': 'Invalid Layer',
                    'description': 'Layer\'s run_id field must the run_id specified in path'
                })
            validate_input_layer(layer_raw)
            layer, samples = ungroup_layer(layer_raw)
            db.session.add(layer)
            for sample in samples:
                db.session.add(sample)
            db.session.commit()
            return next(iter(group_samples(samples, [layer]).values()))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:layers"'
        }, 401)


@api.route('/run/<int:run_id>/layer/<int:layer_id>')
class LayerResource(Resource):
    @api.doc(security='token', model=layer_output)
    @requires_auth
    def get(self, run_id, layer_id):
        if requires_scope('read:layers'):
            layer_values = LayerValue.query\
                .join(Layer, LayerValue.layer_id == Layer.id)\
                .filter(LayerValue.layer_id == layer_id)\
                .filter(Layer.run_id == run_id)\
                .all()
            layer = Layer.query.get(layer_id)
            return next(iter(group_samples(layer_values, [layer]).values()))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:layers"'
        }, 401)

    @api.doc(security='token', model=success_output, body=layer_input)
    @requires_auth
    def put(self, run_id, layer_id):
        if requires_scope('write:layers'):
            # Upsert new values.
            layer_raw = request.json
            if layer_raw['run_id'] != run_id:
                raise ValidationError({
                    'code': 'Invalid Layer',
                    'description': 'Layer\'s run_id field must the run_id specified in path'
                })
            validate_input_layer(layer_raw)
            layer, samples = ungroup_layer(layer_raw, layer_id)
            db.session.add(layer)
            for sample in samples:
                db.session.add(sample)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:layers"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, run_id, layer_id):
        if requires_scope('write:layers'):
            LayerValue.query\
                .filter(LayerValue.layer_id == layer_id)\
                .delete()
            Layer.query.filter_by(id=layer_id).delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:layers"'
        }, 401)
