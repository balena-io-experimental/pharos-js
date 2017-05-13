IMAGE=localhost/pharosjs:latest

build:
	cat Dockerfile.template | sed 's/%%RESIN_MACHINE_NAME%%/intel-nuc/' > Dockerfile
	docker build --tag ${IMAGE} .

run: build
	docker run -it --rm \
		${IMAGE}

