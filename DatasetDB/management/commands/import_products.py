import csv
from django.core.management.base import BaseCommand
from DatasetDB.models import Product
from django.conf import settings
import os


class Command(BaseCommand):
    help = "Import products from CSV file into Product model"

    def handle(self, *args, **kwargs):

        csv_path = os.path.join(
            settings.BASE_DIR,
            "static/Dataset_CSV",
            "final_dataset_position_based_category.csv"
        )

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR("CSV file not found"))
            return

        products = []
        count = 0

        with open(csv_path, newline='', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                discount = row["discount price"]

                # 🔥 Handle NA / empty discount
                if discount in ("NA", "", None):
                    discount = None

                product = Product(
                    sku=row["SKU"],
                    product_name=row["product name"],
                    brand=row["brand"],
                    price=float(row["price"]),
                    discount_price=discount,
                    subcategory=row["subcategory"],
                    category=row["category"]
                )

                products.append(product)
                count += 1

                # 🔥 Bulk insert every 5000 rows (FAST)
                if count % 5000 == 0:
                    Product.objects.bulk_create(
                        products,
                        ignore_conflicts=True
                    )
                    products = []
                    self.stdout.write(f"{count} records inserted")

        # Insert remaining records
        if products:
            Product.objects.bulk_create(
                products,
                ignore_conflicts=True
            )

        self.stdout.write(
            self.style.SUCCESS("CSV import completed successfully")
        )
