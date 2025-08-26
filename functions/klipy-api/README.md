
# KLIPY API Appwrite Function

This Appwrite function acts as a proxy to the KLIPY GIF API, allowing you to search for GIFs or fetch trending GIFs securely from your Appwrite backend.

## Usage

- **Search GIFs:**
	- Send a POST request with a JSON body containing a `query` string to search for GIFs.
- **Trending GIFs:**
	- Send a POST request without a `query` to fetch trending GIFs.
- **Optional parameters:**
	- You can also send `contentFilter` and `nextPage` in the request body to filter results and paginate.

### Example Request Body
```json
{
	"query": "cat",
	"contentFilter": "off",
	"nextPage": 1
}
```

## Environment Variables
- `KLIPY_API_KEY`: Your KLIPY API key (set in Appwrite function settings)

## Resources
- [KLIPY API Documentation](https://api.klipy.com/docs)
- [Appwrite Functions Documentation](https://appwrite.io/docs/functions)

## Notes
- Minimum resources: 0.5 CPU, 512MB RAM
- This function does not store any data; it only proxies requests to KLIPY.

