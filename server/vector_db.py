import sys

sys.stdout.reconfigure(encoding='utf-8')

import chromadb
import uuid

class VectorStore:
    def __init__(self):
        
        self.client = chromadb.PersistentClient(
            path="./data_chrome"
        )

        self.collection = self.client.get_or_create_collection(name="scraped_sites")
        
    def add_document(self, text, url, chunk_size=1000, overlay=100):

        start = 0
        chunks = []
        ids = []
        metadata = []
        
        while start < len(text):
            
            end = start + chunk_size
            
            ids.append(f"{url}_{uuid.uuid4()}")
            metadata.append({"url": url})
            chunks.append(text[start:end])

            start += chunk_size - overlay
        
        if chunks:

            self.collection.add(
                documents=chunks,
                metadatas=metadata,
                ids=ids,
                
            )

            print(f"Сохранено {len(chunks)} чанков в базу данных.")

    def search(self, query, n_results=3):

        results = self.collection.query(
            query_texts=query,
            n_results=n_results
        )

        if results["documents"]:
            return results["documents"][0]
        else:
            return []

    def count(self):
        return self.collection.count()
