from PIL import Image
import sys

# Increase recursion depth if needed, but we use an explicit stack so it's fine.

def process_image(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Track visited pixels
    # Using a 2D array is much faster than a set of tuples
    visited = [[False] * height for _ in range(width)]
    stack = []
    
    # Initialize stack with edges
    for x in range(width):
        stack.extend([(x, 0), (x, height - 1)])
    for y in range(height):
        stack.extend([(0, y), (width - 1, y)])
        
    def is_background(r, g, b):
        min_val = min(r, g, b)
        max_val = max(r, g, b)
        is_grayscale = (max_val - min_val) < 25
        return is_grayscale and r > 165
        
    print("Removing background base...")
    while stack:
        x, y = stack.pop()
        
        if visited[x][y]:
            continue
            
        visited[x][y] = True
        
        r, g, b, a = pixels[x, y]
        if is_background(r, g, b):
            pixels[x, y] = (r, g, b, 0)
            
            if x > 0 and not visited[x - 1][y]: stack.append((x - 1, y))
            if x < width - 1 and not visited[x + 1][y]: stack.append((x + 1, y))
            if y > 0 and not visited[x][y - 1]: stack.append((x, y - 1))
            if y < height - 1 and not visited[x][y + 1]: stack.append((x, y + 1))
            
    print("Feathering edges...")
    # Feathering step (needs to be done on a copy of alphas to avoid bleeding recursively)
    alphas = [[pixels[x, y][3] for y in range(height)] for x in range(width)]
    
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            if alphas[x][y] != 0: # Not fully transparent
                # check neighbors
                neighbors = [
                    alphas[x][y-1],
                    alphas[x][y+1],
                    alphas[x-1][y],
                    alphas[x+1][y]
                ]
                transparent_count = sum(1 for alpha in neighbors if alpha == 0)
                if transparent_count > 0:
                    r, g, b, _ = pixels[x, y]
                    new_alpha = max(0, 255 - (transparent_count * 50))
                    pixels[x, y] = (r, g, b, new_alpha)
                    
    print(f"Saving to {output_path}...")
    img.save(output_path, "PNG")
    print("Done!")

if __name__ == "__main__":
    process_image("public/standing-man.jpg", "public/standing-man-transparent.png")
