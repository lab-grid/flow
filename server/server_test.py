import json
import pprint
import unittest

from decimal import Decimal

from flask_testing import TestCase

from server import app, api, db
from database import Compound, Derivation, Layer, LayerValue, Run, Protocol

from api.compound import api as compounds
from api.derivation import api as derivations
from api.layer import api as layers
from api.protocol import api as protocols
from api.run import api as runs

class ServerTest(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        app.config['AUTH_PROVIDER'] = "none"
        app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/datalayer-test.db"
        api.add_namespace(compounds)
        api.add_namespace(derivations)
        api.add_namespace(layers)
        api.add_namespace(protocols)
        api.add_namespace(runs)

        self.maxDiff = None

        return app

    def setUp(self):
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_read_runs(self):
        # Load example runs.
        example_run_1 = Run()
        example_run_1.id = 6
        example_run_1.name = 'Example Run 9'
        example_run_1.notes = 'Example notes!'
        example_run_1.data_link = 'https://s3.amazon.com/...'
        db.session.add(example_run_1)

        response = self.client.get("/run")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, [{
          "id": 6,
          "name": "Example Run 9",
          "notes": "Example notes!",
          "data_link": "https://s3.amazon.com/..."
        }])

    def test_create_and_get_run(self):
        # Load example protocols.
        example_protocol_1 = Protocol()
        example_protocol_1.id = 6
        example_protocol_1.name = 'Example Protocol 9'
        example_protocol_1.notes = 'Example notes!'
        db.session.add(example_protocol_1)

        data = {
            'protocol_id': 6,
            'name': 'Test Run',
            'notes': 'Test notes!',
            'data_link': 'https://google.com/'
        }
        response = self.client.post(
            "/run",
            data=json.dumps(data),
            headers={'Content-Type': 'application/json'}
        )
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })
        response = self.client.get(f"/run/{response.json['id']}")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })

    def test_read_protocols(self):
        # Load example protocols.
        example_protocol_1 = Protocol()
        example_protocol_1.id = 6
        example_protocol_1.name = 'Example Protocol 9'
        example_protocol_1.notes = 'Example notes!'
        db.session.add(example_protocol_1)

        response = self.client.get("/protocol")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, [{
          "id": 6,
          "name": "Example Protocol 9",
          "notes": "Example notes!"
        }])

    def test_create_and_get_protocol(self):
        data = {
            'name': 'Test Protocol',
            'notes': 'Test notes!'
        }
        response = self.client.post(
            "/protocol",
            data=json.dumps(data),
            headers={'Content-Type': 'application/json'}
        )
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })
        response = self.client.get(f"/protocol/{response.json['id']}")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })

    def test_read_layers(self):
        # Load example compounds.
        example_compound_1 = Compound()
        example_compound_1.id = 3
        example_compound_1.compound_id = 'EXAMPLE-ID-23'
        example_compound_1.batch_id = 1298
        example_compound_1.target_id = 'EXAMPLE-TARGET-8'
        db.session.add(example_compound_1)
        
        # Load example runs.
        example_run_1 = Run()
        example_run_1.id = 6
        example_run_1.name = 'Example Run 9'
        example_run_1.notes = 'Example notes!'
        example_run_1.data_link = 'https://s3.amazon.com/...'
        db.session.add(example_run_1)
        
        # Load example layers.
        example_layer_1 = Layer()
        example_layer_1.id = 2
        example_layer_1.run_id = 6
        example_layer_1.name = 'Readings'
        example_layer_1.row_count = 10
        example_layer_1.column_count = 10
        db.session.add(example_layer_1)

        # Load example samples.
        example_sample_1 = LayerValue()
        example_sample_1.id = 3
        example_sample_1.layer_id = 2
        example_sample_1.compound_id = 3
        example_sample_1.row = 5
        example_sample_1.column = 5
        example_sample_1.value = Decimal('1.234')
        db.session.add(example_sample_1)

        response = self.client.get("/run/6/layer")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, [{
          'id': 2,
          'name': 'Readings',
          'run_id': 6,
          'row_count': 10,
          'column_count': 10,
          'layer_data': [
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, '1.234', None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None]
          ],
          'layer_compound_ids': [
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, 3, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None],
              [None, None, None, None, None, None, None, None, None, None]
          ]
        }])

    def test_create_and_get_layer(self):
        # Load example runs.
        example_run_1 = Run()
        example_run_1.id = 6
        example_run_1.name = 'Example Run 9'
        example_run_1.notes = 'Example notes!'
        example_run_1.data_link = 'https://s3.amazon.com/...'
        db.session.add(example_run_1)

        # Load example compounds.
        example_compound_1 = Compound()
        example_compound_1.id = 3
        example_compound_1.compound_id = 'EXAMPLE-ID-23'
        example_compound_1.batch_id = 1298
        example_compound_1.target_id = 'EXAMPLE-TARGET-8'
        db.session.add(example_compound_1)

        data = {
            'name': 'Readings',
            'run_id': 6,
            'row_count': 1,
            'column_count': 1,
            'layer_data': [
                [None]
            ],
            'layer_compound_ids': [
                [3]
            ]
        }
        response = self.client.post(
            "/run/6/layer",
            data=json.dumps(data),
            headers={'Content-Type': 'application/json'}
        )
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })
        response = self.client.get(f"/run/6/layer/{response.json['id']}")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })

    def test_read_derivations(self):
        # Load example derivations.
        example_derivation_1 = Derivation()
        example_derivation_1.id = 2
        example_derivation_1.name = 'Example Derivation 5'
        example_derivation_1.notes = 'Example notes!'
        example_derivation_1.formula = 'Example(1, 2, 3)'
        db.session.add(example_derivation_1)

        response = self.client.get("/derivation")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, [{
          "id": 2,
          "name": "Example Derivation 5",
          "notes": "Example notes!",
          "formula": "Example(1, 2, 3)"
        }])

    def test_create_and_get_derivation(self):
        data = {
            'name': 'Test Derivation',
            'notes': 'Test notes!',
            'formula': 'Example(1, 2, 3)'
        }
        response = self.client.post(
            "/derivation",
            data=json.dumps(data),
            headers={'Content-Type': 'application/json'}
        )
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })
        response = self.client.get(f"/derivation/{response.json['id']}")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })

    def test_read_compounds(self):
        # Load example compounds.
        example_compound_1 = Compound()
        example_compound_1.id = 3
        example_compound_1.compound_id = 'EXAMPLE-ID-23'
        example_compound_1.batch_id = 1298
        example_compound_1.target_id = 'EXAMPLE-TARGET-8'
        db.session.add(example_compound_1)

        response = self.client.get("/compound")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, [{
          "id": 3,
          "compound_id": "EXAMPLE-ID-23",
          "batch_id": 1298,
          "target_id": "EXAMPLE-TARGET-8"
        }])

    def test_create_and_get_compound(self):
        data = {
            'compound_id': 'Test Compound',
            'batch_id': 65,
            'target_id': 'EXAMPLE-TARGET-8'
        }
        response = self.client.post(
            "/compound",
            data=json.dumps(data),
            headers={'Content-Type': 'application/json'}
        )
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })
        response = self.client.get(f"/compound/{response.json['id']}")
        if response.json is None:
            pprint.pprint(response)
        self.assertEqual(response.json, {
            'id': response.json['id'],
            **data
        })


if __name__ == '__main__':
    unittest.main()
