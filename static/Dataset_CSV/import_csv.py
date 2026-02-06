import pandas as pd
from django.core.management.base import BaseCommand
from DatasetDB.models import Product

class Command(BaseCommand):
    help = "Import CSV data into Product model"

    def handle(self, *args, **kwargs):
        df = pd.read_csv("/static/Dataset_CSV/final_dataset_position_based_category.csv")

        products = []
        for _, row in df.iterrows():
            products.append(Product(
                sku=row['SKU'],
                product_name=row['product name'],
                brand=row['brand'],
                price=row['price'],
                discount_price=row['discount price'],
                subcategory = row['subcategory'],
                category=row['category']
            ))

        Product.objects.bulk_create(products)
        self.stdout.write(self.style.SUCCESS("CSV Imported Successfully"))
