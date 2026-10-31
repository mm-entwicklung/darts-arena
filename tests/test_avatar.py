import base64
import io
import unittest

from server import optimize_avatar


class AvatarTests(unittest.TestCase):
    def test_jpeg_becomes_small_webp(self):
        from PIL import Image
        image = Image.new('RGB', (1200, 800), 'blue')
        stream = io.BytesIO()
        image.save(stream, format='JPEG')
        encoded = 'data:image/jpeg;base64,' + base64.b64encode(stream.getvalue()).decode('ascii')
        result = optimize_avatar(encoded)
        self.assertTrue(result.startswith('data:image/webp;base64,'))
        data = base64.b64decode(result.split(',', 1)[1])
        with Image.open(io.BytesIO(data)) as converted:
            self.assertEqual(converted.size, (256, 256))
            self.assertEqual(converted.format, 'WEBP')

    def test_invalid_image_rejected(self):
        with self.assertRaises(ValueError):
            optimize_avatar('data:image/jpeg;base64,ZmFrZQ==')
