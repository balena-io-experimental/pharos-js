IMAGE=localhost/pharosjs:latest

build:
	cat Dockerfile.template | sed 's/%%RESIN_MACHINE_NAME%%/intel-nuc/' > Dockerfile

