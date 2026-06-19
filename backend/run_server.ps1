# Clean Python cache and run Django server
Get-ChildItem -Path . -Directory -Filter __pycache__ -Recurse | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Filter *.pyc -Recurse | Remove-Item -Force
python manage.py runserver
